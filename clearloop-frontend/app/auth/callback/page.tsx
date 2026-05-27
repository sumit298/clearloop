"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      router.push(`/signin?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      login(token)
        .then(() => router.push("/dashboard"))
        .catch((err) => {
          router.push(`/signin?error=${encodeURIComponent(err.message || "Login failed")}`);
        });
    } else {
      router.push(`/signin?error=${encodeURIComponent("No token received")}`);
    }
  }, [searchParams, login, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-text-dim">Completing sign in...</p>
      </div>
    </div>
  );
}
