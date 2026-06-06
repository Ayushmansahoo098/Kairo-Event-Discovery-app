"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import LoginPageContent from "./login-content";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-kairo-orange" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
