"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { user, character, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const checked = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (checked.current) return;
    checked.current = true;

    async function resolveRedirect() {
      if (character) {
        router.replace("/dashboard");
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/user-profile?email=${encodeURIComponent(user.email)}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.character) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        /* fall through to character-picker */
      }

      router.replace("/character-picker");
    }

    resolveRedirect();
    setChecking(false);
  }, [user, character, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="ml-3 text-muted-foreground text-sm">
        Loading...
      </span>
    </div>
  );
}
