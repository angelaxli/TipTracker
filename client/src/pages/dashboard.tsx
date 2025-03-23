import { Header } from "@/components/layout/Header";
import { EarningsOverview } from "@/components/dashboard/EarningsOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentEarnings } from "@/components/dashboard/RecentEarnings";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <EarningsOverview />
        <QuickActions />
        <RecentEarnings />
      </main>
    </div>
  );
}
