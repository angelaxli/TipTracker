import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || ""}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || ""}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await syncUserWithBackend(user);
    return user;
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
