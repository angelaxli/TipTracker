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

  const { search } = useLocation(); //Use search property of useLocation
  const editId = new URLSearchParams(search).get('edit');

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

  // Parse the URL search params (this part is kept to handle scanner functionality)
  const searchParams = new URLSearchParams(window.location.search);
  const showScanner = searchParams.get("scan") === "true";

  // Handle extracted data from receipt scanner (this part is kept)
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
      <Header showBackButton title={editId ? "Edit Tip" : "Add Tip"} />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {showScanner ? (
          <div className="space-y-6">
            <ReceiptScanner onExtractedData={handleExtractedData} />
            <TipForm initialData={initialData} />
          </div>
        ) : (
          <TipForm initialData={initialData} />
        )}
      </main>
    </div>
  );
}