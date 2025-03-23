import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect, 
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "tipsfortips-bd17d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: "tipsfortips-bd17d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log("Firebase config:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Set" : "Not set",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Set" : "Not set",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Set" : "Not set",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "Set" : "Not set",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? "Set" : "Not set",
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Check for redirect result on page load
export const checkRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      await syncUserWithBackend(user);
      return user;
    }
    return null;
  } catch (error: any) {
    console.error("Error processing redirect result: ", error);
    throw new Error(error.message);
  }
};

export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
    // The result will be handled in checkRedirectResult
  } catch (error: any) {
    console.error("Error signing in with Google: ", error);
    throw new Error(error.message);
  }
};

export const loginWithEmailPassword = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserWithBackend(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error logging in with email/password: ", error);
    throw new Error(error.message);
  }
};

export const registerWithEmailPassword = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await syncUserWithBackend(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error registering with email/password: ", error);
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    await apiRequest("POST", "/api/auth/logout", {});
  } catch (error: any) {
    console.error("Error logging out: ", error);
    throw new Error(error.message);
  }
};

// Sync Firebase user with our backend
const syncUserWithBackend = async (user: User) => {
  if (!user) return;
  
  const idToken = await user.getIdToken();
  
  try {
    await apiRequest("POST", "/api/auth/firebase", {
      firebaseUid: user.uid,
      email: user.email,
      name: user.displayName,
      idToken,
    });
  } catch (error) {
    console.error("Error syncing user with backend:", error);
    throw error;
  }
};

export { auth };
