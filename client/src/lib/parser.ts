import * as XLSX from "xlsx";
import { Benefit, CreditCard } from "./cards";

export type ParsedTransaction = {
  date: string;
  merchant: string;
  amount: number;
  description: string;
};

export type FileProcessingProgress = {
  currentFile: number;
  totalFiles: number;
  fileName: string;
  status: "processing" | "complete" | "error";
};

/**
 * Parse a single file (CSV or Excel) and extract transactions
 */
export async function parseStatementFile(file: File): Promise<ParsedTransaction[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  const transactions: ParsedTransaction[] = [];
  
  // Skip header row and process data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    // Try to extract transaction data from common formats
    const transaction = extractTransaction(row);
    if (transaction) {
      transactions.push(transaction);
    }
  }
  
  return transactions;
}

/**
 * Extract transaction from a row (handles different statement formats)
 */
function extractTransaction(row: any[]): ParsedTransaction | null {
  // Common CSV formats for credit card statements:
  // Format 1: [Date, Description, Amount, ...]
  // Format 2: [Date, Description, Category, Debit, Credit, ...]
  // Format 3: [Transaction Date, Post Date, Description, Category, Type, Amount, ...]
  
  let date = "";
  let merchant = "";
  let amount = 0;
  let description = "";
  
  // Try to find date (usually first or second column)
  for (let i = 0; i < Math.min(3, row.length); i++) {
    const cell = String(row[i] || "").trim();
    if (isDateLike(cell)) {
      date = cell;
      break;
    }
  }
  
  // Try to find merchant/description (usually within first 4 columns)
  for (let i = 0; i < Math.min(4, row.length); i++) {
    const cell = String(row[i] || "").trim();
    if (cell && !isDateLike(cell) && !isNumberLike(cell) && cell.length > 3) {
      merchant = cell;
      description = cell;
      break;
    }
  }
  
  // Try to find amount (look for numeric values)
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (typeof cell === "number") {
      amount = Math.abs(cell);
      break;
    } else if (typeof cell === "string") {
      const cleaned = cell.replace(/[$,\s]/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        amount = Math.abs(parsed);
        break;
      }
    }
  }
  
  // Must have at least merchant and amount
  if (!merchant || amount === 0) {
    return null;
  }
  
  return {
    date: date || "N/A",
    merchant,
    amount,
    description,
  };
}

/**
 * Check if a string looks like a date
 */
function isDateLike(str: string): boolean {
  // Check for common date patterns
  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  // MM/DD/YYYY or M/D/YY
    /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
    /^\d{2}-\d{2}-\d{4}$/,           // DD-MM-YYYY
    /^[A-Z][a-z]{2}\s+\d{1,2}$/,    // Jan 15
  ];
  
  return datePatterns.some(pattern => pattern.test(str));
}

/**
 * Check if a string looks like a number
 */
function isNumberLike(str: string): boolean {
  const cleaned = String(str).replace(/[$,\s]/g, "");
  return !isNaN(parseFloat(cleaned));
}

/**
 * Match transactions to benefits based on merchant keywords
 */
export function matchTransactionsToBenefits(
  transactions: ParsedTransaction[],
  benefits: Benefit[],
  card: CreditCard
): Benefit[] {
  const updatedBenefits = benefits.map(benefit => ({
    ...benefit,
    usedAmount: 0,
    transactions: [] as { date: string; merchant: string; amount: number }[],
  }));
  
  for (const transaction of transactions) {
    const merchantLower = transaction.merchant.toLowerCase();
    const descriptionLower = transaction.description.toLowerCase();
    
    // Try to match to a benefit
    for (const benefit of updatedBenefits) {
      const matched = benefit.merchantKeywords.some(keyword => 
        merchantLower.includes(keyword.toLowerCase()) || 
        descriptionLower.includes(keyword.toLowerCase())
      );
      
      if (matched) {
        // Add transaction to benefit
        benefit.transactions.push({
          date: transaction.date,
          merchant: transaction.merchant,
          amount: transaction.amount,
        });
        
        // Update used amount (cap at total amount)
        benefit.usedAmount = Math.min(
          benefit.usedAmount + transaction.amount,
          benefit.totalAmount
        );
        
        break; // Don't match to multiple benefits
      }
    }
  }
  
  return updatedBenefits;
}

/**
 * Parse text input (manually pasted transactions)
 */
export function parseTextInput(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split("\n").filter(line => line.trim());
  
  for (const line of lines) {
    // Try to extract transaction info from free-form text
    // Look for patterns like: "MERCHANT_NAME $XX.XX" or "MERCHANT_NAME XX.XX"
    const amountMatch = line.match(/\$?(\d+\.?\d*)/);
    
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      const merchant = line.replace(/\$?(\d+\.?\d*)/, "").trim();
      
      if (merchant && amount > 0) {
        transactions.push({
          date: "N/A",
          merchant,
          amount,
          description: merchant,
        });
      }
    }
  }
  
  return transactions;
}

/**
 * Process multiple files with progress tracking
 */
export async function processMultipleFiles(
  files: File[],
  onProgress?: (progress: FileProcessingProgress) => void
): Promise<ParsedTransaction[]> {
  const allTransactions: ParsedTransaction[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress({
        currentFile: i + 1,
        totalFiles: files.length,
        fileName: file.name,
        status: "processing",
      });
    }
    
    try {
      const transactions = await parseStatementFile(file);
      allTransactions.push(...transactions);
      
      if (onProgress) {
        onProgress({
          currentFile: i + 1,
          totalFiles: files.length,
          fileName: file.name,
          status: "complete",
        });
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      
      if (onProgress) {
        onProgress({
          currentFile: i + 1,
          totalFiles: files.length,
          fileName: file.name,
          status: "error",
        });
      }
    }
  }
  
  return allTransactions;
}

/**
 * Aggregate benefits across multiple months for monthly reset periods
 */
export function aggregateMonthlyBenefits(benefits: Benefit[]): Benefit[] {
  return benefits.map(benefit => {
    if (benefit.resetPeriod === "monthly") {
      // Calculate how many months of benefit could be used (assume 12 months)
      const annualTotal = benefit.totalAmount * 12;
      
      return {
        ...benefit,
        totalAmount: annualTotal,
        description: `${benefit.description} (Annual total: 12 × $${benefit.totalAmount})`,
      };
    }
    
    if (benefit.resetPeriod === "semi-annually") {
      // Two periods per year
      const annualTotal = benefit.totalAmount * 2;
      
      return {
        ...benefit,
        totalAmount: annualTotal,
        description: `${benefit.description} (Annual total: 2 × $${benefit.totalAmount})`,
      };
    }
    
    return benefit;
  });
}

