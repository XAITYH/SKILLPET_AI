"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setStrapiToken } = useAuth();
  const [status, setStatus] = useState<
    "processing" | "syncing" | "redirecting"
  >("processing");
  const [error, setError] = useState("");
  const handled = useRef(false);

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const idToken = params.get("id_token");
        const accessToken = params.get("access_token");
        const oauthError = params.get("error");

        if (oauthError) {
          setError("Authentication was denied. Please try again.");
          return;
        }

        if (!accessToken && !idToken) {
          setError(
            "No authentication token received. Please try again.",
          );
          return;
        }

        setStatus("syncing");

        const strapiRes = await fetch(`${STRAPI_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (strapiRes.ok) {
          const strapiUser = await strapiRes.json();
          await fetch("/api/auth/sync-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: strapiUser.documentId || strapiUser.id,
              email: strapiUser.email,
              name:
                strapiUser.username ||
                strapiUser.name ||
                strapiUser.email.split("@")[0],
              authProvider: "google",
            }),
          });
          setStrapiToken(accessToken!, strapiUser);
          setStatus("redirecting");
          router.push("/");
          return;
        }

        const res = await fetch("/api/auth/google-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_token: idToken,
            access_token: accessToken,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err.error || "Failed to authenticate with Google",
          );
        }

        const data = await res.json();

        await fetch("/api/auth/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.user.documentId || data.user.id,
            email: data.user.email,
            name:
              data.user.username ||
              data.user.name ||
              data.user.email.split("@")[0],
            authProvider: "google",
          }),
        });

        setStrapiToken(data.jwt, data.user);
        setStatus("redirecting");
        router.push("/");
      } catch {
        setError(
          "Failed to authenticate. Please try signing in with email instead.",
        );
      }
    }

    handleCallback();
  }, [router, setStrapiToken, STRAPI_URL]);

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-xl font-bold">
              !
            </span>
          </div>
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/auth")}
            className="text-sm text-primary hover:underline font-medium cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {status === "processing" && "Completing authentication..."}
          {status === "syncing" && "Setting up your account..."}
          {status === "redirecting" && "Redirecting..."}
        </p>
      </div>
    </main>
  );
}
