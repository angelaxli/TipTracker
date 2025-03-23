import { Header } from "@/components/layout/Header";
import { EarningsOverview } from "@/components/dashboard/EarningsOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentEarnings } from "@/components/dashboard/RecentEarnings";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!user && !loading) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse h-8 w-8 rounded-full bg-primary/50"></div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
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
