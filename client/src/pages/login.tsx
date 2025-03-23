import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse h-8 w-8 rounded-full bg-primary/50"></div>
      </div>
    );
  }
  
  if (user) {
    return null;
  }
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <LoginForm />
    </div>
  );
}
