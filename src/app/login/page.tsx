"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/auth-context";
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login, user, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/profile");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    login(email);
    router.push("/profile");
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
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 mb-6">
            <Logo />
          </div>
          <h2 className="text-center text-4xl font-extrabold tracking-tight text-kairo-white">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-kairo-light-gray">
            Sign in to access your saved events and tickets.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-kairo-gray mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-kairo-gray" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-kairo-dark-gray border border-kairo-gray rounded-2xl text-kairo-white placeholder-kairo-gray focus:outline-none focus:border-kairo-orange focus:ring-4 focus:ring-kairo-orange/10 transition-all"
                  placeholder="alex@kairo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-kairo-gray mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-kairo-gray" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-kairo-dark-gray border border-kairo-gray rounded-2xl text-kairo-white placeholder-kairo-gray focus:outline-none focus:border-kairo-orange focus:ring-4 focus:ring-kairo-orange/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-kairo-gray bg-kairo-dark-gray text-kairo-orange focus:ring-kairo-orange/50"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-kairo-light-gray">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-kairo-orange hover:text-kairo-grad-2 transition-colors">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-2xl text-kairo-white bg-kairo-orange hover:bg-kairo-grad-2 hover:shadow-xl hover:shadow-kairo-orange/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-kairo-gray text-sm">
          Any email/password combination will work for this demo.
        </p>
      </div>
    </div>
  );
}
