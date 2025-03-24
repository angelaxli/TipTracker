import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Tesseract from "tesseract.js";

// Define a Receipt type for better type checking
type Receipt = { amount: string; date: string };

interface ReceiptScannerProps {
  onExtractedData: (data: Receipt[]) => void;
}

export function ReceiptScanner({ onExtractedData }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedReceipts, setScannedReceipts] = useState<Receipt[][]>([]);
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

          // Split text into potential receipt sections based on common delimiters
          const receiptSections = text.split(/(?:\n\s*\n|\*{3,}|\-{3,}|\={3,})/g)
            .filter(section => section.trim().length > 0);

          const extractedResults: Receipt[] = [];

          for (const section of receiptSections) {
            // Extract tip amount
            const tipRegex = /(?:tip|gratuity|tip amount|grat)(?:\s*[:\.]\s*|\s+)\$?(\d+\.\d{2})/i;
            const tipMatch = section.match(tipRegex);
            const tipAmount = tipMatch ? tipMatch[1] : "";

            // Extract date
            const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|([A-Z][a-z]{2}\s\d{1,2},?\s\d{4})/g;
            const dates = Array.from(section.matchAll(dateRegex)).map(match => match[0]);
            const firstDate = dates.length > 0 ? dates[0] : "";

            // Only add if we found either amount or date
            if (tipAmount || firstDate) {
              extractedResults.push({
                amount: tipAmount,
                date: firstDate,
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

  const handleUseData = (receipt: Receipt[]) => {
    onExtractedData(receipt);
    toast({
      title: "Data Applied",
      description: "Receipt data has been applied to the form.",
    });
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
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="space-y-1">
                    {receipt.map((item: Receipt, i: number) => (
                      <div key={i} className="text-sm text-gray-600">
                        Amount: <span className="font-medium text-gray-800">${item.amount || 'N/A'}</span>{' '}
                        Date: <span className="font-medium text-gray-800">{item.date || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseData(receipt)}
                    disabled={!receipt.some((r: Receipt) => r.amount || r.date)}
                  >
                    Use Data
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}