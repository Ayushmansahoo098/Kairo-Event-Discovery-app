"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/auth-context";
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { OAuthButtons } from "@/components/oauth-buttons";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export default function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";
  const { login, user, isLoading, isOAuthConfigured } = useAuthContext();

  useEffect(() => {
    if (!isLoading && user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err: unknown) {
      console.error("Login failed:", err);
      setError(getAuthErrorMessage(err, "Authentication failed. Please verify your credentials."));
      setIsSubmitting(false);
    }
  };

  if (isLoading || user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-kairo-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-kairo-primary">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700 p-8 border border-kairo-orange/15 shadow-[0_10px_40px_rgba(0,0,0,0.6)] rounded-none">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-6">
            <Logo />
          </div>
          <h2 className="text-center text-3xl font-serif font-light tracking-[0.15em] uppercase text-kairo-white">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-xs text-kairo-light-gray leading-relaxed font-light tracking-[0.02em]">
            Sign in to access your saved events and preferences.
          </p>
        </div>

        {!isOAuthConfigured && (
          <div className="rounded-none border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-200 leading-relaxed">
            Firebase is not configured. Copy <code className="text-amber-100">.env.example</code> to{" "}
            <code className="text-amber-100">.env.local</code> and enable Google/GitHub under Firebase
            Authentication → Sign-in method.
          </div>
        )}

        {error && (
          <div className="rounded-none border border-red-500/30 bg-red-500/10 px-4 py-3 text-[11px] text-red-200">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-kairo-light-gray uppercase tracking-[0.2em] mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-kairo-gray">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-kairo-dark-gray/30 border border-kairo-gray/30 rounded-none text-kairo-white placeholder-kairo-gray/40 focus:outline-none focus:border-kairo-orange transition-all text-xs tracking-wider"
                  placeholder="alex@kairo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-kairo-light-gray uppercase tracking-[0.2em] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-kairo-gray">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-kairo-dark-gray/30 border border-kairo-gray/30 rounded-none text-kairo-white placeholder-kairo-gray/40 focus:outline-none focus:border-kairo-orange transition-all text-xs tracking-wider"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs tracking-wide">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded-none border-kairo-gray/40 bg-kairo-dark-gray/30 text-kairo-orange focus:ring-0"
              />
              <label htmlFor="remember-me" className="ml-2 block text-[11px] text-kairo-light-gray font-light">
                Remember me
              </label>
            </div>

            <div>
              <a href="#" className="font-bold text-kairo-orange hover:text-kairo-white transition-colors">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-xs font-bold uppercase tracking-[0.3em] text-kairo-primary bg-kairo-orange hover:bg-kairo-orange/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-none cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute w-full border-t border-kairo-gray/20"></div>
          <span className="relative px-4 text-[9px] text-kairo-light-gray uppercase tracking-[0.25em] font-bold bg-kairo-primary">
            Or continue with
          </span>
        </div>

        <OAuthButtons
          disabled={isSubmitting}
          onStart={() => {
            setIsSubmitting(true);
            setError("");
          }}
          onSuccess={() => router.push(redirectTo)}
          onError={(message) => {
            setError(message);
            setIsSubmitting(false);
          }}
          onCancel={() => setIsSubmitting(false)}
        />

        <p className="text-center text-kairo-gray text-[10px] tracking-wide">
          New here? Use Google or GitHub — your profile is created automatically.
        </p>
      </div>
    </div>
  );
}
