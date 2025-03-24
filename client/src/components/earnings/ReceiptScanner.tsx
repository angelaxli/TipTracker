import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Tesseract from "tesseract.js";
import { queryClient } from "@/lib/queryClient";

// Define a Receipt type for better type checking
type Receipt = { amount: string; date: string; source?: string; notes?: string };

interface ReceiptScannerProps {
  onExtractedData: (data: Receipt[]) => void;
}

export function ReceiptScanner({ onExtractedData }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedReceipts, setScannedReceipts] = useState<Receipt[][]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [savedReceipts, setSavedReceipts] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsScanning(true);
    toast({
      title: "Processing",
      description: `Analyzing ${files.length} receipt(s)...`,
    });

    try {
      const results = await Promise.all(
        Array.from(files).map(async (file) => {
          const result = await Tesseract.recognize(file, "eng");
          const text = result.data.text;

          // Debug: Log the full text being read
          console.log("Full text extracted from receipt:", text);
          console.log("Confidence score:", result.data.confidence);

          // Split text into potential receipt sections
          // Split into receipts based on large gaps and common receipt separators
          const sections = text.split(/(?:\n{4,}|={3,}|\*{3,}|-{3,}|\bTOTAL\b.*\n{2,})/gi)
            .map(section => section.trim())
            .filter(section => section.length > 0);

          console.log("Detected receipt sections:", sections);

          // Process text to find all tips and dates across sections
          const extractedResults: Receipt[] = [];

          // Process each section as a separate receipt
          sections.forEach((section, index) => {
            // For each section, find the first tip and date match only
            const tipMatch = section.match(/(TIP|Tip|Tp|GRATUITY|Grat)\s*[:=]?\s*\$?(\d+\.\d{2})/i);
            const dateMatch = section.match(/\b\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4})\b/);

            // Only add if we found a tip
            if (tipMatch) {
              extractedResults.push({
                amount: tipMatch[2],
                date: dateMatch ? new Date(dateMatch[0]).toISOString() : new Date().toISOString(),
                source: "cash",
                notes: `Receipt ${index + 1}`
              });
            }
          });

          // Enhanced patterns to catch more formats
          const tipPatterns = [
            /(TIP|Tip|GRATUITY|Grat)\s*[:=]?\s*\$?(\d+\.\d{2})/g,
            /(?:^|\s)\$?(\d+\.\d{2})\s*(?:TIP|Tip|GRATUITY|Grat)/g,
            /TIP\s*\$?(\d+\.\d{2})/i
          ];

          const datePatterns = [
            /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s\d{2}\/\d{2}\/\d{4}\s\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)\b/g,
            /\b\d{2}\/\d{2}\/\d{4}\s\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)\b/g,
            /\b\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4})\b/g,
            /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi
          ];

          // Process each section independently for better multi-receipt handling
          sections.forEach(section => {
            let tipAmount: string | null = null;
            let receiptDate: string | null = null;
            
            // Find all tip amounts in this section
            for (const pattern of tipPatterns) {
              const matches = Array.from(section.matchAll(pattern));
              if (matches.length > 0) {
                // Take the last match in case of multiple matches
                const match = matches[matches.length - 1];
                tipAmount = match[2] || match[1];
                break;
              }
            }

            // Find date using multiple patterns
            for (const pattern of datePatterns) {
              const match = section.match(pattern);
              if (match) {
                const dateStr = match[0].replace(/\s?([ap])m\b/i, (_, p1) => ` ${p1.toUpperCase()}M`);
                try {
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    receiptDate = date.toISOString();
                    break;
                  }
                } catch {
                  continue;
                }
              }
            }

            // If we found both tip and date, add to results
            if (tipAmount && !isNaN(parseFloat(tipAmount))) {
              extractedResults.push({
                amount: tipAmount,
                date: receiptDate || new Date().toISOString(),
                source: "cash", // Default source
                notes: "Scanned from receipt"
              });
            }
          });

          // If no results were found, try analyzing the whole text
          if (extractedResults.length === 0) {
            const simpleRegex = /(?:tip|gratuity|tip amount|grat)(?:\s*[:\.]\s*|\s+)\$?(\d+\.\d{2})/i;
            const simpleDateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|([A-Z][a-z]{2}\s\d{1,2},?\s\d{4})/g;

            const tipMatch = text.match(simpleRegex);
            const tipAmount = tipMatch ? tipMatch[1] : "";
            const firstDate = text.match(simpleDateRegex)?.[0] || "";

            if (tipAmount || firstDate) {
              extractedResults.push({
                amount: tipAmount,
                date: firstDate,
              });
            }
          }

          return extractedResults;
        })
      );

      setScannedReceipts(results.filter(receiptArray => receiptArray.some(r => r.amount || r.date)));

      toast({
        title: "Scan Complete",
        description: `Successfully analyzed ${files.length} receipt(s).`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not process one or more receipts. Try again with clearer images.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleUseData = async (receipt: Receipt[]) => {
    try {
      for (const item of receipt) {
        // Clean and validate the tip amount
        const cleanAmount = item.amount?.replace(/[^\d.]/g, '');
        const tipAmount = cleanAmount ? parseFloat(cleanAmount) : 0;

        if (!cleanAmount || isNaN(tipAmount) || tipAmount <= 0) {
          throw new Error("Please enter a valid tip amount greater than 0");
        }

        const tipDate = new Date(item.date || new Date());
        if (isNaN(tipDate.getTime())) {
          throw new Error("Invalid date format");
        }

        const tipData = {
          amount: parseFloat(tipAmount.toFixed(2)),
          date: tipDate.toISOString(),
          source: item.source || "cash",
          notes: item.notes || "",
          userId: 1
        };

        const response = await fetch('/api/tips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tipData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save tip');
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/tips'] });

      onExtractedData(receipt);
      toast({
        title: "Tip Saved",
        description: "Receipt data has been saved successfully.",
      });

      // Redirect after successful save
      setTimeout(() => {
        window.location.href = '/earnings-log';
      }, 1000);
    } catch (error: any) {
      console.error("Error saving tip:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tip data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800">Scan Receipts</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Upload one or more receipt images to automatically extract tip information.
        </p>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors duration-200 cursor-pointer mb-6"
          onClick={handleUploadClick}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">Multiple files supported - JPG, PNG, or PDF up to 10MB each</p>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileChange}
            disabled={isScanning}
          />
        </div>

        {scannedReceipts.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Extracted Information</h3>

            <div className="space-y-3">
              {scannedReceipts.map((receipt: Receipt[], index: number) => (
                <div key={index} className="space-y-2 p-2 bg-gray-50 rounded">
                  {savedReceipts.includes(index) ? (
                    <div className="text-center py-4">
                      <p className="text-green-600 font-medium mb-2">Tip Saved!</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScannedReceipts(scannedReceipts.filter((_, i) => i !== index));
                          setNotes(notes.filter((_, i) => i !== index));
                          setSavedReceipts(savedReceipts.filter(i => i !== index));
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        {receipt.map((item: Receipt, i: number) => (
                          <div key={i} className="text-sm text-gray-600">
                            Amount: <span className="font-medium text-gray-800">${item.amount || 'N/A'}</span>{' '}
                            Date: <span className="font-medium text-gray-800">{item.date || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <select
                          className="w-full p-2 text-sm border rounded"
                          value={receipt[0]?.source || "cash"}
                          onChange={(e) => {
                            const newReceipts = [...scannedReceipts];
                            newReceipts[index] = receipt.map(item => ({
                              ...item,
                              source: e.target.value
                            }));
                            setScannedReceipts(newReceipts);
                          }}
                        >
                          <option value="cash">Cash</option>
                          <option value="venmo">Venmo</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="other">Other</option>
                        </select>
                        <textarea
                          className="w-full p-2 text-sm border rounded"
                          placeholder="Add notes about this tip..."
                          value={notes[index] || ''}
                          onChange={(e) => {
                            const newNotes = [...notes];
                            newNotes[index] = e.target.value;
                            setNotes(newNotes);
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setScannedReceipts(scannedReceipts.filter((_, i) => i !== index));
                            setNotes(notes.filter((_, i) => i !== index));
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleUseData([...receipt, { notes: notes[index] || '' }]);
                            setSavedReceipts([...savedReceipts, index]);
                          }}
                          disabled={!receipt.some((r: Receipt) => r.amount || r.date)}
                        >
                          Save Tip
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}