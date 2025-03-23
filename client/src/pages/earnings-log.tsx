import { Header } from "@/components/layout/Header";
import { EarningsTable } from "@/components/earnings/EarningsTable";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function EarningsLog() {
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
      <Header showBackButton title="Earnings Log" />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <EarningsTable />
      </main>
    </div>
  );
}
