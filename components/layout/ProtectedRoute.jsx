"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { roleHome, ROLES } from "@/lib/constants/roles";

const allowedPrefixes = {
  [ROLES.MANAGER]: "/manager",
  [ROLES.EXECUTIVE]: "/executive",
  [ROLES.CLIENT]: "/client"
};

export default function ProtectedRoute({ children, allowedRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    const prefix = allowedPrefixes[user.role];

    if (!prefix || (allowedRole && user.role !== allowedRole)) {
      router.replace(roleHome(user.role));
    }
  }, [loading, user, allowedRole, pathname, router]);

  if (loading || !user) {
    return <LoadingSpinner fullPage label="Checking session..." />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <LoadingSpinner fullPage label="Redirecting..." />;
  }

  return children;
}
