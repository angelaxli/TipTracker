import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import Tesseract from "tesseract.js";

// Define a Receipt type for better type checking
type Receipt = { amount: string; date: string };

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
  const location = useLocation();

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

          // Split text into potential receipt sections based on common delimiters and receipt markers
          const receiptSections = text.split(/(?:\n\s*\n|\*{3,}|\-{3,}|\={3,}|(?=\b(?:check|receipt|invoice|order)\b))/gi)
            .filter(section => section.trim().length > 0);

          const extractedResults: Receipt[] = [];

          for (const section of receiptSections) {
            // Find all tip amounts in the section
            const tipRegex = /(?:tip|gratuity|tip amount|grat)(?:\s*[:\.]\s*|\s+)\$?(\d+\.\d{2})/gi;
            const tipMatches = Array.from(section.matchAll(tipRegex));

            // Find all dates in the section
            const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|([A-Z][a-z]{2}\s\d{1,2},?\s\d{4})/g;
            const dates = Array.from(section.matchAll(dateRegex)).map(match => match[0]);

            // Try to find time if available
            const timeRegex = /(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)/g;
            const times = Array.from(section.matchAll(timeRegex)).map(match => match[0]);

            // For each tip amount found, create a receipt entry
            tipMatches.forEach((tipMatch, index) => {
              const tipAmount = tipMatch[1];
              // Use corresponding date and time if available, otherwise use the first found
              const date = dates[index] || dates[0] || "";
              const time = times[index] || times[0] || "";

              if (tipAmount) {
                extractedResults.push({
                  amount: tipAmount,
                  date: date + (time ? " " + time : ""),
                });
              }
            });

            // If no tips were found but we have dates, add placeholder entries
            if (tipMatches.length === 0 && dates.length > 0) {
              dates.forEach((date, index) => {
                const time = times[index] || times[0] || "";
                extractedResults.push({
                  amount: "",
                  date: date + (time ? " " + time : ""),
                });
              });
            }
          }

          // If no sections were found with data, try analyzing the whole text as one receipt
          if (extractedResults.length === 0) {
            // Redefining these here to make them available in this scope
            const tipRegex = /(?:tip|gratuity|tip amount|grat)(?:\s*[:\.]\s*|\s+)\$?(\d+\.\d{2})/i;
            const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|([A-Z][a-z]{2}\s\d{1,2},?\s\d{4})/g;

            const tipMatch = text.match(tipRegex);
            const tipAmount = tipMatch ? tipMatch[1] : "";
            const dates = Array.from(text.matchAll(dateRegex)).map(match => match[0]);
            const firstDate = dates.length > 0 ? dates[0] : "";

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

      // Make sure we're setting the state with an array of arrays
      setScannedReceipts(results.filter((receiptArray: Receipt[]) => 
        receiptArray.some((r: Receipt) => r.amount || r.date)
      ));

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
        const tipData = {
          amount: Number(item.amount) || 0,
          date: new Date(item.date || new Date()).toISOString(),
          source: "cash",
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
          const errorMessage = errorData.message || 'Failed to save tip';
          throw new Error(errorMessage);
        }
      }

      // Invalidate and refetch tips data
      await queryClient.invalidateQueries({ queryKey: ['/api/tips'] });

      onExtractedData(receipt);
      toast({
        title: "Tip Saved",
        description: "Receipt data has been saved successfully.",
      });

      // Navigate to earnings log
      location('/earnings-log');
    } catch (error) {
      console.error("Error saving tip:", error);
      toast({
        title: "Error",
        description: `Failed to save tip data: ${error.message}. Please try again.`,
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
                          Use Data
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