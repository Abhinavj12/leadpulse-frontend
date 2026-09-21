"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { ROLES } from "@/lib/constants/roles";

export default function ClientLayout({ children }) {
  return <ProtectedRoute allowedRole={ROLES.CLIENT}>{children}</ProtectedRoute>;
}
