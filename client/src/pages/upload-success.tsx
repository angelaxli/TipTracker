
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Link } from "wouter";

export default function UploadSuccess() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton title="Success" />
      
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold text-green-600 mb-4">Earning Logged!</h2>
        <Link href="/earnings-log">
          <Button size="lg">
            View Earnings Log
          </Button>
        </Link>
      </main>
    </div>
  );
}
