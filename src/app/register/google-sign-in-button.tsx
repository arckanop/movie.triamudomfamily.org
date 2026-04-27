"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { signIn, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({
  label = "Sign in with Google",
  signOutFirst = false,
}: {
  label?: string;
  signOutFirst?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (signOutFirst) {
            await signOut();
          }
          const res = await signIn.social({
            provider: "google",
            callbackURL: "/register",
          });
          if (res.error) {
            toast.error(res.error.message ?? "Sign-in failed");
          }
        })
      }
    >
      {pending ? "Redirecting…" : label}
    </Button>
  );
}
