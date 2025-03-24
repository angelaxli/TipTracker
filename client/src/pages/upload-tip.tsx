import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { TipForm } from "@/components/earnings/TipForm";
import { ReceiptScanner } from "@/components/earnings/ReceiptScanner";
import { format } from "date-fns";
import { useLocation } from 'wouter'; 
import { useQuery } from '@tanstack/react-query';

// Added type definition.  Replace with your actual type if different.
type Tip = {
  id: number;
  amount: number;
  source: string;
  date: string;
  notes?: string;
};


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

  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const editId = searchParams.get('edit');
  const showScanner = searchParams.get("scan") === "true";

  const { data: tips, isLoading } = useQuery<Tip[]>({
    queryKey: ['/api/tips'],
    enabled: !!editId // Only fetch tips if editId is present
  });

  const tipToEdit = editId && tips ? tips.find(t => t.id === parseInt(editId, 10)) : undefined;

  const initialData = tipToEdit ? {
    id: tipToEdit.id,
    amount: tipToEdit.amount.toString(),
    source: tipToEdit.source,
    date: format(new Date(tipToEdit.date), "yyyy-MM-dd'T'HH:mm"),
    notes: tipToEdit.notes || "",
  } : {
    amount: "",
    source: "cash",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: "",
  };

  // Handle extracted data from receipt scanner
  const handleExtractedData = (data: { amount: string; date: string }[]) => {
    // Use the first item if available
    if (data.length > 0) {
      const firstItem = data[0];
      const updatedData = { ...formData };

      if (firstItem.amount) {
        updatedData.amount = firstItem.amount;
      }

      if (firstItem.date) {
        try {
          const parsedDate = new Date(firstItem.date);
          if (!isNaN(parsedDate.getTime())) {
            updatedData.date = format(parsedDate, "yyyy-MM-dd'T'HH:mm");
          }
        } catch (e) {
          // If date parsing fails, keep the existing date
        }
      }

      setFormData(updatedData);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton title={editId ? "Edit Tip" : "Add Tip"} />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-6">
          <ReceiptScanner onExtractedData={handleExtractedData} />
          <TipForm initialData={initialData} />
        </div>
      </main>
    </div>
  );
}