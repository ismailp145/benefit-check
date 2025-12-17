import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, DollarSign, ArrowRight, CreditCard, Receipt, FileUp, X, ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard as CreditCardType, 
  Benefit, 
  getAllCards, 
  getCardById, 
  initializeBenefits 
} from "@/lib/cards";
import { 
  parseTextInput, 
  processMultipleFiles, 
  matchTransactionsToBenefits,
  aggregateMonthlyBenefits,
  FileProcessingProgress,
  ParsedTransaction
} from "@/lib/parser";
import { applyTheme } from "@/lib/theme";
import { PDFDownloadButton } from "@/components/pdf-summary";

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<CreditCardType>(getCardById("amexGold")!);
  const [isCardSelectorExpanded, setIsCardSelectorExpanded] = useState(false);
  const [inputText, setInputText] = useState("");
  const [benefits, setBenefits] = useState<Benefit[]>(
    aggregateMonthlyBenefits(initializeBenefits(selectedCard))
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingProgress, setProcessingProgress] = useState<FileProcessingProgress | null>(null);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Apply theme when card changes
  useEffect(() => {
    applyTheme(selectedCard.theme);
  }, [selectedCard]);

  const handleCardSelect = (card: CreditCardType) => {
    setSelectedCard(card);
    setBenefits(aggregateMonthlyBenefits(initializeBenefits(card)));
    setIsCardSelectorExpanded(false);
    setShowResults(false);
    setInputText("");
    setUploadedFiles([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    setProcessingProgress(null);
    
    let allTransactions: ParsedTransaction[] = [];

    // 1. Process Text Input
    if (inputText.trim()) {
      const textTransactions = parseTextInput(inputText);
      allTransactions.push(...textTransactions);
    }

    // 2. Process Files with progress tracking
    if (uploadedFiles.length > 0) {
      const fileTransactions = await processMultipleFiles(
        uploadedFiles,
        (progress) => setProcessingProgress(progress)
      );
      allTransactions.push(...fileTransactions);
    }

    // 3. Match transactions to benefits
    const baseBenefits = aggregateMonthlyBenefits(initializeBenefits(selectedCard));
    const matchedBenefits = matchTransactionsToBenefits(
      allTransactions,
      baseBenefits,
      selectedCard
    );

    setTotalTransactions(allTransactions.length);
    
    // Add a small delay for better UX
    setTimeout(() => {
      setBenefits(matchedBenefits);
      setIsAnalyzing(false);
      setShowResults(true);
      setProcessingProgress(null);
    }, 800);
  };

  const reset = () => {
    setShowResults(false);
    setInputText("");
    setUploadedFiles([]);
    setBenefits(aggregateMonthlyBenefits(initializeBenefits(selectedCard)));
    setTotalTransactions(0);
  };

  const allCards = getAllCards();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-secondary selection:text-black">
      <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
        
        {/* Header */}
        <header className="border-b-2 border-black pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none">
                BENEFIT<span className="text-secondary">.</span>CHECK
              </h1>
              <p className="text-xl font-mono border-l-4 border-secondary pl-4 py-1 max-w-lg">
                Stop wasting your annual fee. Upload your statement. See what you're missing.
              </p>
            </div>
            <div className="hidden md:block">
              <button
                onClick={() => setIsCardSelectorExpanded(!isCardSelectorExpanded)}
                className="w-24 h-16 bg-secondary border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] relative"
              >
                <span className="font-black text-xl uppercase">{selectedCard.theme.displayName}</span>
                {isCardSelectorExpanded ? (
                  <ChevronUp className="absolute -bottom-1 -right-1 w-4 h-4" />
                ) : (
                  <ChevronDown className="absolute -bottom-1 -right-1 w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Card Selector - Expandable */}
          <AnimatePresence>
            {isCardSelectorExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-8"
              >
                <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-xl font-bold mb-4 uppercase">Select Your Card</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleCardSelect(card)}
                        className={`p-4 border-2 border-black text-left transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          selectedCard.id === card.id ? "bg-secondary" : "bg-white"
                        }`}
                      >
                        <div className="font-bold text-sm uppercase mb-1">{card.issuer}</div>
                        <div className="text-xs mb-2">{card.displayName}</div>
                        <div 
                          className="w-full h-2 border border-black" 
                          style={{ backgroundColor: card.theme.secondary }}
                        />
                        <div className="text-xs mt-2 font-mono">${card.annualFee}/yr</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Mobile Card Selector */}
        <div className="md:hidden">
          <button
            onClick={() => setIsCardSelectorExpanded(!isCardSelectorExpanded)}
            className="w-full h-16 bg-secondary border-2 border-black flex items-center justify-between px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <span className="font-black text-xl uppercase">{selectedCard.displayName}</span>
            {isCardSelectorExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
        </div>

        {/* Input Section */}
        <section className="space-y-6">
          {!showResults ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Receipt className="w-6 h-6" /> INPUT STATEMENT
                </h2>
                <span className="font-mono text-sm bg-black text-white px-2 py-1">STEP 01</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Text Area */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-black opacity-100 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-200"></div>
                  <div className="relative bg-white border-2 border-black p-1 h-full">
                    <Textarea 
                      placeholder="Paste text directly... (e.g. 'UBER EATS $15.00')"
                      className="h-full min-h-[200px] resize-none border-none focus-visible:ring-0 font-mono text-sm bg-transparent p-4 rounded-none placeholder:text-muted-foreground/50"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      data-testid="input-statement"
                    />
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-black opacity-100 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-200"></div>
                  <div className="relative bg-white border-2 border-black p-1 h-full flex flex-col">
                    <label className="flex-1 flex flex-col items-center justify-center p-6 cursor-pointer border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-colors">
                      <FileUp className="w-10 h-10 mb-4 text-muted-foreground" />
                      <span className="font-bold text-lg uppercase mb-1">Upload Files</span>
                      <span className="text-xs font-mono text-muted-foreground text-center">DRAG & DROP OR CLICK<br/>CSV OR EXCEL (Multiple Files OK)</span>
                      <input 
                        type="file" 
                        multiple 
                        accept=".csv, .xls, .xlsx" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        data-testid="input-file-upload"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-bold text-sm uppercase mb-2">Attached Files ({uploadedFiles.length}):</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center font-mono text-xs bg-gray-100 p-2 border border-black">
                        <span className="truncate">{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="hover:bg-red-500 hover:text-white p-1 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Progress */}
              {isAnalyzing && processingProgress && (
                <div className="border-2 border-black p-4 bg-secondary/10">
                  <div className="font-bold text-sm uppercase mb-2">
                    Processing: {processingProgress.currentFile} of {processingProgress.totalFiles}
                  </div>
                  <div className="text-xs font-mono mb-2">{processingProgress.fileName}</div>
                  <Progress value={(processingProgress.currentFile / processingProgress.totalFiles) * 100} />
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!inputText && uploadedFiles.length === 0)}
                  className="rounded-none h-14 px-8 text-lg font-bold border-2 border-black bg-secondary text-black hover:bg-secondary/90 hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                  data-testid="button-analyze"
                >
                  {isAnalyzing ? "ANALYZING..." : "ANALYZE SPEND"} <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CreditCard className="w-6 h-6" /> BENEFIT ANALYSIS
                </h2>
                <Button 
                  variant="outline" 
                  onClick={reset}
                  className="rounded-none border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  START OVER
                </Button>
              </div>

              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-sm font-mono">
                  <span className="font-bold">Card:</span> {selectedCard.displayName} | 
                  <span className="font-bold"> Files Processed:</span> {uploadedFiles.length} | 
                  <span className="font-bold"> Transactions:</span> {totalTransactions}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => (
                  <BenefitCard key={benefit.id} benefit={benefit} index={index} />
                ))}
              </div>

              <div className="bg-black text-white p-8 border-2 border-black shadow-[8px_8px_0px_0px_var(--color-secondary)]">
                <h3 className="text-2xl font-bold mb-4">SUMMARY</h3>
                <div className="grid grid-cols-2 gap-8 font-mono mb-6">
                  <div>
                    <p className="text-gray-400 text-sm">TOTAL VALUE AVAILABLE</p>
                    <p className="text-4xl font-bold">${benefits.reduce((acc, b) => acc + b.totalAmount, 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">VALUE CAPTURED</p>
                    <p className="text-4xl font-bold text-secondary">${benefits.reduce((acc, b) => acc + b.usedAmount, 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="font-mono text-sm">
                  <p className="text-gray-400 mb-1">ANNUAL FEE: ${selectedCard.annualFee}</p>
                  <p className="text-gray-400">
                    NET VALUE: ${(benefits.reduce((acc, b) => acc + b.usedAmount, 0) - selectedCard.annualFee).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* PDF Download Button */}
              <div className="flex justify-center pt-4">
                <PDFDownloadButton 
                  card={selectedCard}
                  benefits={benefits}
                  totalFilesProcessed={uploadedFiles.length}
                  totalTransactions={totalTransactions}
                />
              </div>
            </motion.div>
          )}
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t-2 border-black text-sm font-mono text-muted-foreground flex justify-between items-end">
          <div>
            <p>BENEFIT.CHECK v1.0</p>
            <p>NOT AFFILIATED WITH ANY FINANCIAL INSTITUTION.</p>
          </div>
          <div className="text-right">
            <p>DESIGNED FOR UTILITY.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function BenefitCard({ benefit, index }: { benefit: Benefit, index: number }) {
  const isFullyUsed = benefit.usedAmount >= benefit.totalAmount;
  const percentage = Math.min((benefit.usedAmount / benefit.totalAmount) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="relative group h-full"
    >
      {/* Brutalist Shadow/Border Trick */}
      <div className="absolute inset-0 bg-black translate-x-2 translate-y-2"></div>
      
      <div className={`relative h-full bg-white border-2 border-black p-6 flex flex-col justify-between transition-transform duration-200 ${isFullyUsed ? 'bg-secondary/10' : ''}`}>
        
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs font-bold border border-black px-2 py-0.5 uppercase">
              {benefit.resetPeriod}
            </span>
            {isFullyUsed && <Check className="w-6 h-6 text-black" />}
          </div>
          
          <h3 className="text-2xl font-black uppercase mb-1 leading-none">{benefit.name}</h3>
          <p className="text-sm font-mono text-muted-foreground leading-tight min-h-[40px]">
            {benefit.description}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end font-mono">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">USED</span>
              <span className="text-xl font-bold">${benefit.usedAmount.toFixed(2)}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-muted-foreground">CAP</span>
              <span className="text-xl font-bold text-muted-foreground line-through decoration-2 decoration-secondary decoration-wavy">
                <span className="text-black no-underline decoration-auto">${benefit.totalAmount.toFixed(2)}</span>
              </span>
            </div>
          </div>

          <div className="h-4 w-full border-2 border-black p-0.5 bg-white">
            <div 
              className="h-full bg-secondary transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {benefit.transactions.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-black/10">
              <p className="text-xs font-bold mb-2 uppercase">Identified Transactions:</p>
              <ul className="space-y-1">
                {benefit.transactions.slice(0, 3).map((tx, i) => (
                  <li key={i} className="text-xs font-mono flex justify-between">
                    <span className="truncate max-w-[70%]">{tx.merchant}</span>
                    <span>${tx.amount.toFixed(2)}</span>
                  </li>
                ))}
                {benefit.transactions.length > 3 && (
                  <li className="text-xs font-mono text-muted-foreground">
                    +{benefit.transactions.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
