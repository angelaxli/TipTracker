import { Header } from "@/components/layout/Header";
import { EarningsGraph } from "@/components/earnings/EarningsGraph";

export default function EarningsGraphPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton title="Earnings Graph" />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <EarningsGraph />
      </main>
    </div>
  );
}
