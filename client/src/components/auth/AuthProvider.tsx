import { createContext, useContext, useEffect, useState } from "react";
import { auth, checkRedirectResult } from "@/lib/firebase";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for redirect result when component mounts
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        await checkRedirectResult();
      } catch (error: any) {
        console.error("Error checking redirect result:", error);
        
        // Friendly error message based on error code
        let errorMessage = error.message || "Error during authentication redirect";
        if (error.code === "auth/configuration-not-found") {
          errorMessage = "Authentication configuration error. Please make sure you've added this domain to the authorized domains in Firebase console.";
        } else if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
          errorMessage = "Sign-in popup was blocked or closed. Please try again and allow the popup.";
        } else if (error.code === "auth/cancelled-popup-request") {
          errorMessage = "Sign-in was cancelled. Please try again.";
        } else if (error.code === "auth/network-request-failed") {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
        
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    handleRedirectResult();
  }, [toast]);

  // Check if the user is logged in with Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check if user is authenticated on the server
  const { isLoading: isServerAuthLoading } = useQuery({
    queryKey: ['/api/auth/current-user'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });

  return (
    <AuthContext.Provider value={{ user, loading: loading || isServerAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
