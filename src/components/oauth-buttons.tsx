"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/auth-context";
import { getAuthErrorMessage, isAuthCancellation } from "@/lib/auth-errors";
import type { OAuthProviderId } from "@/lib/oauth-providers";

interface OAuthButtonsProps {
  disabled?: boolean;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  onCancel?: () => void;
  className?: string;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="currentColor"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
      />
    </svg>
  );
}

const buttonClassName =
  "flex items-center justify-center gap-2.5 py-3.5 px-4 bg-transparent border border-kairo-gray/30 text-kairo-white hover:text-kairo-orange hover:border-kairo-orange/50 hover:bg-white/5 transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-none";

export function OAuthButtons({
  disabled = false,
  onStart,
  onSuccess,
  onError,
  onCancel,
  className,
}: OAuthButtonsProps) {
  const { loginWithOAuth, isOAuthConfigured } = useAuthContext();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProviderId | null>(null);

  const handleOAuth = async (provider: OAuthProviderId) => {
    if (!isOAuthConfigured) {
      onError?.("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local.");
      return;
    }

    setLoadingProvider(provider);
    onStart?.();
    try {
      await loginWithOAuth(provider);
      onSuccess?.();
    } catch (error) {
      if (isAuthCancellation(error)) {
        onCancel?.();
        return;
      }
      onError?.(getAuthErrorMessage(error));
    } finally {
      setLoadingProvider(null);
    }
  };

  const isBusy = disabled || loadingProvider !== null;

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={isBusy || !isOAuthConfigured}
        className={buttonClassName}
        aria-label="Continue with Google"
      >
        {loadingProvider === "google" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <GoogleIcon className="w-3.5 h-3.5" />
        )}
        Google
      </button>
      <button
        type="button"
        onClick={() => handleOAuth("github")}
        disabled={isBusy || !isOAuthConfigured}
        className={buttonClassName}
        aria-label="Continue with GitHub"
      >
        {loadingProvider === "github" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <GithubIcon className="w-3.5 h-3.5" />
        )}
        GitHub
      </button>
    </div>
  );
}
