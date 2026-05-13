"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setChecked(true);

    const handleExpired = () => {
      setChecked(false); // stop rendering children mid-navigation
      router.replace("/login");
    };
    window.addEventListener("admin-auth-expired", handleExpired);
    return () => window.removeEventListener("admin-auth-expired", handleExpired);
  }, [router]);

  if (!checked) return null;
  return <>{children}</>;
}
