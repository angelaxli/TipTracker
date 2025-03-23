import { Header } from "@/components/layout/Header";
import { TrendsAnalysis } from "@/components/earnings/TrendsAnalysis";

export default function TrendAnalysisPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showBackButton title="Tip Trends Analysis" />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <TrendsAnalysis />
      </main>
    </div>
  );
}