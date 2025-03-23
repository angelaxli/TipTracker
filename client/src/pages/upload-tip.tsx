import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { TipForm } from "@/components/earnings/TipForm";
import { ReceiptScanner } from "@/components/earnings/ReceiptScanner";
import { format } from "date-fns";

export default function UploadTip() {
  const [formData, setFormData] = useState<{
    amount: string;
    source: string;
    date: string;
    notes?: string;
  }>({
    amount: "",
    source: "cash",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: "",
  });

  // Parse the URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const showScanner = searchParams.get("scan") === "true";

  // Handle extracted data from receipt scanner
  const handleExtractedData = (data: { amount: string; date: string }) => {
    const updatedData = { ...formData };
    
    if (data.amount) {
      updatedData.amount = data.amount;
    }
    
    if (data.date) {
      try {
        const parsedDate = new Date(data.date);
        if (!isNaN(parsedDate.getTime())) {
          updatedData.date = format(parsedDate, "yyyy-MM-dd'T'HH:mm");
        }
      } catch (e) {
        // If date parsing fails, keep the existing date
      }
    }
    
    setFormData(updatedData);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton title="Upload Tip" />
      
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {showScanner ? (
          <div className="space-y-6">
            <ReceiptScanner onExtractedData={handleExtractedData} />
            <TipForm initialData={formData} />
          </div>
        ) : (
          <TipForm initialData={formData} />
        )}
      </main>
    </div>
  );
}
