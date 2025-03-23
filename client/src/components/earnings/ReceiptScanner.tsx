import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check } from "lucide-react";
import Tesseract from "tesseract.js";

interface ReceiptScannerProps {
  onExtractedData: (data: { amount: string; date: string }) => void;
}

export function ReceiptScanner({ onExtractedData }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<{ amount: string; date: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    toast({
      title: "Processing",
      description: "Analyzing your receipt...",
    });

    try {
      const result = await Tesseract.recognize(file, "eng");
      const text = result.data.text;
      
      // Extract amount - looking for patterns like $XX.XX or XX.XX
      const amountRegex = /\$?(\d+\.\d{2})/g;
      const amounts = [];
      let match;
      
      while ((match = amountRegex.exec(text)) !== null) {
        amounts.push(match[1]);
      }
      
      // Extract date - looking for common date formats
      const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|([A-Z][a-z]{2}\s\d{1,2},?\s\d{4})/g;
      const dates = [];
      
      while ((match = dateRegex.exec(text)) !== null) {
        dates.push(match[0]);
      }
      
      // Use the largest amount as the tip amount (as a simple heuristic)
      // In a real app, we'd want more sophisticated logic
      const largestAmount = amounts.length > 0 
        ? Math.max(...amounts.map(a => parseFloat(a))).toFixed(2) 
        : "";
        
      // Use the first found date
      const firstDate = dates.length > 0 ? dates[0] : "";
      
      const extractedResult = {
        amount: largestAmount,
        date: firstDate,
      };
      
      setExtractedData(extractedResult);
      
      toast({
        title: "Scan Complete",
        description: "Receipt analyzed successfully.",
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not process the receipt. Try again with a clearer image.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleUseData = () => {
    if (extractedData) {
      onExtractedData(extractedData);
      toast({
        title: "Data Applied",
        description: "Receipt data has been applied to the form.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800">Scan Receipt</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Upload a receipt image to automatically extract tip information.
        </p>
        
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors duration-200 cursor-pointer mb-6"
          onClick={handleUploadClick}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">JPG, PNG, or PDF up to 10MB</p>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            disabled={isScanning}
          />
        </div>
        
        {extractedData && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Extracted Information</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-sm font-medium text-gray-800">
                  {extractedData.amount ? `$${extractedData.amount}` : "Not found"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium text-gray-800">
                  {extractedData.date || "Not found"}
                </span>
              </div>
              
              <div className="pt-3 flex justify-end">
                <Button 
                  onClick={handleUseData}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Use These Values
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
