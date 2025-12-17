import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from "@react-pdf/renderer";
import { Benefit, CreditCard } from "@/lib/cards";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";

// PDF Styles with brutalist theme
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 30,
    borderBottom: "3px solid #000000",
    paddingBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 12,
    borderLeft: "4px solid #000000",
    paddingLeft: 8,
  },
  benefitCard: {
    marginBottom: 15,
    padding: 12,
    border: "2px solid #000000",
    backgroundColor: "#FFFFFF",
  },
  benefitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  benefitName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  benefitPeriod: {
    fontSize: 10,
    border: "1px solid #000000",
    padding: "2px 6px",
    textTransform: "uppercase",
  },
  benefitDescription: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 8,
  },
  benefitAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 10,
    color: "#666666",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#FFFFFF",
    border: "2px solid #000000",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000000",
  },
  transactionList: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #CCCCCC",
  },
  transactionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  transaction: {
    fontSize: 9,
    marginBottom: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryBox: {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    padding: 15,
    border: "2px solid #000000",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#CCCCCC",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: "2px solid #000000",
    fontSize: 9,
    color: "#666666",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

type PDFSummaryProps = {
  card: CreditCard;
  benefits: Benefit[];
  totalFilesProcessed: number;
  totalTransactions: number;
};

// PDF Document Component
const BenefitSummaryDocument = ({ card, benefits, totalFilesProcessed, totalTransactions }: PDFSummaryProps) => {
  try {
    const totalValueAvailable = benefits.reduce((acc, b) => acc + b.totalAmount, 0);
    const totalValueCaptured = benefits.reduce((acc, b) => acc + b.usedAmount, 0);
    const utilizationRate = totalValueAvailable > 0 ? (totalValueCaptured / totalValueAvailable) * 100 : 0;
    const currentDate = new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });

    console.log("BenefitSummaryDocument rendering:", {
      card: card.displayName,
      benefitsCount: benefits.length,
      totalValueAvailable,
      totalValueCaptured
    });

    return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BENEFIT.CHECK</Text>
          <Text style={styles.subtitle}>Annual Benefit Analysis Report</Text>
          <Text style={styles.subtitle}>Generated: {currentDate}</Text>
        </View>

        {/* Card Info */}
        <View style={styles.section}>
          <Text style={styles.cardName}>{card.displayName}</Text>
          <Text style={styles.subtitle}>Annual Fee: ${card.annualFee}</Text>
          <Text style={styles.subtitle}>Files Processed: {totalFilesProcessed}</Text>
          <Text style={styles.subtitle}>Transactions Analyzed: {totalTransactions}</Text>
        </View>

        {/* Summary */}
        <View style={[styles.section, styles.summaryBox]}>
          <Text style={styles.summaryTitle}>SUMMARY</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TOTAL VALUE AVAILABLE</Text>
              <Text style={styles.summaryValue}>${totalValueAvailable.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>VALUE CAPTURED</Text>
              <Text style={styles.summaryValue}>${totalValueCaptured.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>UTILIZATION RATE</Text>
              <Text style={styles.summaryValue}>{utilizationRate.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Benefits Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits Breakdown</Text>
          {benefits.map((benefit, index) => {
            // Calculate percentage, ensuring it's always a valid number
            const percentage = benefit.totalAmount > 0 
              ? Math.min((benefit.usedAmount / benefit.totalAmount) * 100, 100)
              : 0;
            // Ensure percentage is a valid number (not NaN)
            const safePercentage = isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
            return (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitHeader}>
                  <Text style={styles.benefitName}>{benefit.name}</Text>
                  <Text style={styles.benefitPeriod}>{benefit.resetPeriod}</Text>
                </View>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
                
                <View style={styles.benefitAmount}>
                  <View>
                    <Text style={styles.amountLabel}>USED</Text>
                    <Text style={styles.amountValue}>${benefit.usedAmount.toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text style={styles.amountLabel}>AVAILABLE</Text>
                    <Text style={styles.amountValue}>${benefit.totalAmount.toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text style={styles.amountLabel}>UTILIZATION</Text>
                    <Text style={styles.amountValue}>{safePercentage.toFixed(0)}%</Text>
                  </View>
                </View>

                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${safePercentage}%` }]} />
                </View>

                {benefit.transactions.length > 0 && (
                  <View style={styles.transactionList}>
                    <Text style={styles.transactionTitle}>
                      Identified Transactions ({benefit.transactions.length}):
                    </Text>
                    {benefit.transactions.slice(0, 5).map((tx, txIndex) => (
                      <View key={txIndex} style={styles.transaction}>
                        <Text>{tx.date} - {tx.merchant}</Text>
                        <Text>${tx.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                    {benefit.transactions.length > 5 && (
                      <Text style={styles.transaction}>
                        ... and {benefit.transactions.length - 5} more
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>BENEFIT.CHECK v1.0</Text>
          <Text>Not affiliated with any financial institution</Text>
        </View>
      </Page>
    </Document>
    );
  } catch (error) {
    console.error("Error rendering PDF document:", error);
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>ERROR</Text>
            <Text style={styles.subtitle}>Failed to generate PDF: {String(error)}</Text>
          </View>
        </Page>
      </Document>
    );
  }
};

// Download Button Component
type PDFDownloadButtonProps = PDFSummaryProps;

export function PDFDownloadButton(props: PDFDownloadButtonProps) {
  const fileName = `benefit-summary-${props.card.name}-${new Date().toISOString().split('T')[0]}.pdf`;
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  console.log("PDFDownloadButton rendered with props:", {
    card: props.card.displayName,
    benefitsCount: props.benefits.length,
    totalFilesProcessed: props.totalFilesProcessed,
    totalTransactions: props.totalTransactions,
    fileName
  });
  
  // Generate PDF blob manually as fallback
  const generatePdfManually = async () => {
    try {
      setIsGenerating(true);
      console.log("Generating PDF manually...");
      const doc = <BenefitSummaryDocument {...props} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      setPdfBlob(blob);
      console.log("PDF generated manually!", { blobSize: blob.size });
      
      // Trigger download
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      console.log("Download triggered!");
    } catch (error) {
      console.error("Error generating PDF manually:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleButtonClick = () => {
    console.log("PDF button clicked!", { hasPdfBlob: !!pdfBlob, isGenerating, fileName });
    
    if (pdfBlob && !isGenerating) {
      // Use cached blob
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      console.log("Download triggered from cached blob!");
    } else if (!isGenerating) {
      // Generate PDF manually
      generatePdfManually();
    }
  };
  
  return (
    <>
      <PDFDownloadLink
        document={<BenefitSummaryDocument {...props} />}
        fileName={fileName}
        className="inline-flex items-center justify-center rounded-none h-14 px-8 text-lg font-bold border-2 border-black bg-secondary text-black transition-all hover:bg-secondary/90 hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
        style={{ 
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {({ loading, blob, url, error }) => {
          // Log button state changes
          console.log("PDFDownloadLink state:", { loading, hasBlob: !!blob, hasUrl: !!url, error, url });
          
          // Log any errors for debugging
          if (error) {
            console.error("PDF generation error:", error);
          }
          
          // Log when PDF is ready
          if (blob && !loading) {
            console.log("PDF ready for download!", { blobSize: blob.size, url });
            // Cache the blob
            if (!pdfBlob) {
              setPdfBlob(blob);
            }
          }
          
          // If PDFDownloadLink works, use it; otherwise fall back to manual generation
          if (blob && url && !loading) {
            return (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                DOWNLOAD PDF SUMMARY <Download className="ml-2 w-6 h-6" />
              </span>
            );
          }
          
          // Fallback: manual button
          return (
            <span 
              onClick={(e) => {
                e.preventDefault();
                handleButtonClick();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              {isGenerating || loading ? "GENERATING PDF..." : "DOWNLOAD PDF SUMMARY"} <Download className="ml-2 w-6 h-6" />
            </span>
          );
        }}
      </PDFDownloadLink>
    </>
  );
}

