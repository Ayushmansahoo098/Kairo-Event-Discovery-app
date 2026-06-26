"use client";

import { isAuthCancellation } from "@/lib/auth-errors";
import { auth, db, hasCredentials } from "@/lib/firebase";
import { createOAuthProvider, type OAuthProviderId } from "@/lib/oauth-providers";
import {
    createUserWithEmailAndPassword,
    getRedirectResult,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: "user" | "organizer";
  onboarded?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOAuthConfigured: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithOAuth: (provider: OAuthProviderId) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveUserEmail(firebaseUser: FirebaseUser): string {
  if (firebaseUser.email) return firebaseUser.email;
  const providerEmail = firebaseUser.providerData.find((p) => p.email)?.email;
  if (providerEmail) return providerEmail;
  return `${firebaseUser.uid}@users.kairo.app`;
}

function resolveUserName(firebaseUser: FirebaseUser, email: string): string {
  if (firebaseUser.displayName) return firebaseUser.displayName;
  const localPart = email.split("@")[0];
  return localPart.replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Kairo User";
}

async function syncUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const email = resolveUserEmail(firebaseUser);
  const userDocRef = doc(db, "users", firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);
  const provider = firebaseUser.providerData[0]?.providerId || "password";

  if (userDoc.exists()) {
    const data = userDoc.data();
    const updatePayload: Record<string, any> = {};
    if (!data.provider) {
      updatePayload.provider = provider;
    }
    if (!data.createdAt) {
      updatePayload.createdAt = new Date();
    }
    if (Object.keys(updatePayload).length > 0) {
      await updateDoc(userDocRef, updatePayload);
    }

    return {
      id: firebaseUser.uid,
      name: data.name || firebaseUser.displayName || resolveUserName(firebaseUser, email),
      email,
      avatar: data.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: data.role || "user",
      onboarded: data.onboarded ?? false,
    };
  }

  const defaultName = resolveUserName(firebaseUser, email);
  const defaultAvatar = firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

  await setDoc(userDocRef, {
    name: defaultName,
    email,
    avatar: defaultAvatar,
    role: "user",
    onboarded: false,
    createdAt: new Date(),
    provider,
  });

  return {
    id: firebaseUser.uid,
    name: defaultName,
    email,
    avatar: defaultAvatar,
    role: "user",
    onboarded: false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasCredentials) {
      setIsLoading(false);
      return;
    }

    // Complete OAuth redirect flow when user returns from Google/GitHub
    getRedirectResult(auth).catch((error) => {
      if (!isAuthCancellation(error)) {
        console.error("OAuth redirect failed:", error);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const email = resolveUserEmail(firebaseUser);
          document.cookie = `kairo_user_email=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;
          const profile = await syncUserProfile(firebaseUser);
          setUser(profile);
        } else {
          document.cookie = "kairo_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          setUser(null);
        }
      } catch (err: any) {
        if (err?.code === "permission-denied") {
          console.warn("Error in onAuthStateChanged profile lookup (permission-denied). Check Firestore rules.");
        } else {
          console.warn("Error in onAuthStateChanged profile lookup:", err);
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password = "DefaultPassword123") => {
    if (!hasCredentials) throw new Error("Firebase is not configured.");
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (
        authError.code === "auth/user-not-found" ||
        authError.code === "auth/invalid-credential"
      ) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          const name = resolveUserName(firebaseUser, email);
          const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

          await setDoc(doc(db, "users", firebaseUser.uid), {
            name,
            email,
            avatar,
            role: "user",
            createdAt: new Date(),
            provider: "password",
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

  const loginWithOAuth = async (providerId: OAuthProviderId) => {
    if (!hasCredentials) {
      throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local.");
    }

    setIsLoading(true);
    const provider = createOAuthProvider(providerId);

    try {
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      const authError = error as { code?: string };

      // Fall back to full-page redirect when pop-ups are blocked
      if (authError.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
        return;
      }

      setIsLoading(false);

      if (isAuthCancellation(error)) return;
      throw error;
    }
  };

  const loginWithGoogle = () => loginWithOAuth("google");
  const loginWithGithub = () => loginWithOAuth("github");

  const logout = async () => {
    setIsLoading(true);
    try {
      document.cookie = "kairo_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = (url: string) => {
    setUser((prev) => (prev ? { ...prev, avatar: url } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOAuthConfigured: hasCredentials,
        login,
        loginWithGoogle,
        loginWithGithub,
        loginWithOAuth,
        logout,
        updateAvatar,
      }}
    >
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
