import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
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
    retry: false,
    onError: (err) => {
      toast({
        title: "Authentication Error",
        description: "Error validating your session. Please log in again.",
        variant: "destructive",
      });
    }
  });

  return (
    <AuthContext.Provider value={{ user, loading: loading || isServerAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
