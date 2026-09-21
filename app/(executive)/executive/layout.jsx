"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { ROLES } from "@/lib/constants/roles";

export default function ExecutiveLayout({ children }) {
  return <ProtectedRoute allowedRole={ROLES.EXECUTIVE}>{children}</ProtectedRoute>;
}
