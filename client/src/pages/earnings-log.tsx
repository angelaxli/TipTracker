import { Header } from "@/components/layout/Header";
import { EarningsTable } from "@/components/earnings/EarningsTable";

export default function EarningsLog() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton title="Earnings Log" />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <EarningsTable />
      </main>
    </div>
  );
}
