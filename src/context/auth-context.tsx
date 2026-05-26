"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: "user" | "organizer";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Set session cookie for middleware admin route protection
          const email = firebaseUser.email || "";
          document.cookie = `kairo_user_email=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;

          // Fetch additional profile data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || "Alex Kairo",
              email: email,
              avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              role: data.role || "user",
            });
          } else {
            // Profile doesn't exist in Firestore yet (fallback creation)
            const defaultName = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Alex Kairo";
            const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
            
            await setDoc(userDocRef, {
              name: defaultName,
              email: email,
              avatar: defaultAvatar,
              role: "user",
              createdAt: new Date(),
            });

            setUser({
              id: firebaseUser.uid,
              name: defaultName,
              email: email,
              avatar: defaultAvatar,
              role: "user",
            });
          }
        } else {
          // Clear session cookie when user logs out
          document.cookie = "kairo_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          setUser(null);
        }
      } catch (err) {
        console.error("Error in onAuthStateChanged profile lookup:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Login or Auto-Register Email and Password credentials.
   * If user doesn't exist, automatically registers them to preserve mock flow behavior.
   */
  const login = async (email: string, password = "DefaultPassword123") => {
    setIsLoading(true);
    try {
      // Try logging in
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If user does not exist or credentials incorrect, auto-create account for seamless demo experience
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          // Initialize Firestore user profile document
          const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Alex Kairo";
          const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

          await setDoc(doc(db, "users", firebaseUser.uid), {
            name,
            email,
            avatar,
            role: "user",
            createdAt: new Date(),
          });
        } catch (regError) {
          setIsLoading(false);
          throw regError;
        }
      } else {
        setIsLoading(false);
        throw error;
      }
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear session cookie before signing out
      document.cookie = "kairo_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
