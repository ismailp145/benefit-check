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
  const dateIndices: number[] = [];
  
  // First pass: identify date columns to exclude from amount search
  for (let i = 0; i < Math.min(5, row.length); i++) {
    const cell = String(row[i] || "").trim();
    if (isDateLike(cell)) {
      if (!date) {
        date = cell;
      }
      dateIndices.push(i);
    }
  }
  
  // Try to find merchant/description (usually within first 4 columns, skip dates)
  for (let i = 0; i < Math.min(4, row.length); i++) {
    if (dateIndices.includes(i)) continue;
    const cell = String(row[i] || "").trim();
    if (cell && !isNumberLike(cell) && cell.length > 3) {
      merchant = cell;
      description = cell;
      break;
    }
  }
  
  // Try to find amount (skip date columns and look for dollar amounts)
  // Look for amounts that are clearly transaction amounts:
  // - Have decimal points (e.g., 12.50)
  // - Have dollar signs
  // - Are reasonable transaction amounts (not tiny numbers like 1, 2, 3 which could be months)
  for (let i = 0; i < row.length; i++) {
    // Skip columns we've identified as dates
    if (dateIndices.includes(i)) continue;
    
    const cell = row[i];
    const cellStr = typeof cell === "string" ? cell.trim() : String(cell);
    
    let cellValue: number | null = null;
    
    if (typeof cell === "number") {
      // Excel dates are typically > 40000 (serial date), amounts are usually < 100000
      // Also check if it's a reasonable transaction amount (has decimal part or is large enough)
      // Skip very small integers (1-31) that could be day/month components
      if (cell < 40000 && cell >= 0.01) {
        const cellStrNum = String(cell);
        // Prefer numbers with decimals, or numbers >= 1 that aren't likely dates
        if (cellStrNum.includes(".") || (cell >= 1 && cell <= 100000)) {
          cellValue = Math.abs(cell);
        }
      }
    } else if (typeof cell === "string") {
      // Look for dollar signs or decimal points (indicating currency)
      // Also check for patterns like "12.50" which are clearly amounts
      if (cellStr.includes("$") || cellStr.includes(".") || /^\d+\.\d{2}$/.test(cellStr.replace(/[$,\s()]/g, ""))) {
        const cleaned = cellStr.replace(/[$,\s()]/g, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) {
          cellValue = parsed;
        }
      }
    }
    
    // If we found a value, check if it looks like a transaction amount
    if (cellValue !== null && cellValue > 0) {
      // Prefer amounts with decimals or amounts that are clearly not date components
      const hasDecimal = cellStr.includes(".");
      const isReasonableAmount = cellValue >= 0.01 && cellValue <= 100000;
      
      // If it has a decimal or is a reasonable transaction amount, use it
      // Avoid single-digit integers that could be months (1-12)
      if (hasDecimal || (isReasonableAmount && (cellValue >= 1 && (cellValue > 31 || hasDecimal)))) {
        amount = cellValue;
        break;
      }
    }
  }
  
  // If we still haven't found an amount, try a more lenient search
  // but still skip date columns and avoid small integers
  if (amount === 0) {
    for (let i = 0; i < row.length; i++) {
      if (dateIndices.includes(i)) continue;
      
      const cell = row[i];
      const cellStr = typeof cell === "string" ? cell.trim() : String(cell);
      
      if (typeof cell === "number" && cell !== 0 && cell < 40000 && cell >= 0.01) {
        // Avoid single-digit integers that could be date components
        if (cell > 31 || String(cell).includes(".")) {
          amount = Math.abs(cell);
          break;
        }
      } else if (typeof cell === "string") {
        const cleaned = cellStr.replace(/[$,\s()]/g, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0 && parsed < 100000 && parsed >= 0.01) {
          amount = parsed;
          break;
        }
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
 * Get the per-transaction credit cap for a benefit
 * This is the maximum amount that can be credited per transaction
 */
function getPerTransactionCreditCap(benefit: Benefit): number {
  // Special case: Resy credit is $50 per transaction (2x $50 per year)
  if (benefit.id === "resy") {
    return 50;
  }
  
  // For monthly benefits, the totalAmount is the monthly credit amount
  // which is also the per-transaction cap
  if (benefit.resetPeriod === "monthly") {
    return benefit.totalAmount;
  }
  
  // For other benefits, use totalAmount as the per-transaction cap
  // (most credits cap at the total benefit amount per transaction)
  return benefit.totalAmount;
}

/**
 * Check if a transaction appears to be a credit/adjustment (not a charge)
 */
function isCreditTransaction(transaction: ParsedTransaction): boolean {
  const text = (transaction.merchant + " " + transaction.description).toLowerCase();
  const creditKeywords = ["credit", "adjustment", "reimbursement", "refund", "rebate", "payment", "credit adjustment"];
  
  // Check for credit keywords in merchant/description
  if (creditKeywords.some(keyword => text.includes(keyword))) {
    return true;
  }
  
  // Credits are often indicated by parentheses or negative signs in statements
  // But since we're using Math.abs() when parsing, we need to check the original text
  // For now, rely on keywords since we normalize amounts to positive
  return false;
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
        // Check if this is a credit transaction (from Amex) or a charge
        const isCredit = isCreditTransaction(transaction);
        
        let creditedAmount: number;
        
        if (isCredit) {
          // For credit transactions, use the amount as-is (it's already the credit amount)
          creditedAmount = transaction.amount;
        } else {
          // For charge transactions, cap at the per-transaction credit limit
          // (e.g., if you spend $10 at Dunkin, only $7 is credited)
          const perTransactionCap = getPerTransactionCreditCap(benefit);
          creditedAmount = Math.min(transaction.amount, perTransactionCap);
        }
        
        // Calculate how much can still be added to usedAmount
        const remainingCredit = benefit.totalAmount - benefit.usedAmount;
        const amountToAdd = Math.min(creditedAmount, remainingCredit);
        
        // Add transaction to benefit (store original amount for display)
        benefit.transactions.push({
          date: transaction.date,
          merchant: transaction.merchant,
          amount: transaction.amount,
        });
        
        // Update used amount (only add the credited portion, capped at total benefit amount)
        if (amountToAdd > 0) {
          benefit.usedAmount = Math.min(
            benefit.usedAmount + amountToAdd,
            benefit.totalAmount
          );
        }
        
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

