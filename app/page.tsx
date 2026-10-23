'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMerchantUser } from "@/lib/storage";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const user = getMerchantUser();
      if (user && user.isLoggedIn) {
        router.replace("/overview");
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex items-center gap-3 text-sm text-zinc-500">
        <svg className="h-5 w-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>Redirecting…</span>
      </div>
    </div>
  );
}
