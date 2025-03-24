
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Tesseract from "tesseract.js";

interface ReceiptScannerProps {
  onExtractedData: (data: { amount: string; date: string }) => void;
}

export function ReceiptScanner({ onExtractedData }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedReceipts, setScannedReceipts] = useState<Array<{ amount: string; date: string }>>([]);
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
          
          // Extract tip amount
          const tipRegex = /(?:tip|gratuity|tip amount|grat)(?:\s*[:\.]\s*|\s+)\$?(\d+\.\d{2})/i;
          const tipMatch = text.match(tipRegex);
          const tipAmount = tipMatch ? tipMatch[1] : "";

          // Extract date
          const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|([A-Z][a-z]{2}\s\d{1,2},?\s\d{4})/g;
          const dates = text.match(dateRegex) || [];
          const firstDate = dates.length > 0 ? dates[0] : "";

          return {
            amount: tipAmount,
            date: firstDate,
          };
        })
      );

      setScannedReceipts(results.filter(r => r.amount || r.date));
      
      toast({
        title: "Scan Complete",
        description: `Successfully analyzed ${results.length} receipt(s).`,
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

  const handleUseData = (receipt: { amount: string; date: string }) => {
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
              {scannedReceipts.map((receipt, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      Amount: <span className="font-medium text-gray-800">${receipt.amount || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Date: <span className="font-medium text-gray-800">{receipt.date || 'N/A'}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseData(receipt)}
                    disabled={!receipt.amount && !receipt.date}
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
