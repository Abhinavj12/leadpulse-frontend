"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { ROLES } from "@/lib/constants/roles";

export default function ManagerLayout({ children }) {
  return <ProtectedRoute allowedRole={ROLES.MANAGER}>{children}</ProtectedRoute>;
}
