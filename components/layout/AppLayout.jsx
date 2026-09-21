"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Offcanvas from "react-bootstrap/Offcanvas";

import { useAuth } from "@/hooks/useAuth";

const nav = {
  manager: [
    ["/manager/dashboard", "Dashboard", "bi-grid-1x2"],
    ["/manager/clients", "Clients", "bi-building"],
    ["/manager/executives", "Executives", "bi-people"],
    ["/manager/lead-lists", "Lead Lists", "bi-list-ul"],
    ["/manager/campaigns", "Campaigns", "bi-megaphone"],
    ["/manager/trust-loop", "Conversions", "bi-shield-check"],
    ["/manager/cadences", "Cadences", "bi-diagram-3"],
    ["/manager/reports", "Reports", "bi-file-earmark-bar-graph"],
    ["/manager/profile", "Profile", "bi-person"]
  ],
  executive: [
    ["/executive/dashboard", "Dashboard", "bi-grid-1x2"],
    ["/executive/campaigns", "Campaigns", "bi-megaphone"],
    ["/executive/callbacks-due", "Callbacks Due", "bi-alarm"],
    ["/executive/profile", "Profile", "bi-person"]
  ],
  client: [
    ["/client/dashboard", "Dashboard", "bi-grid-1x2"],
    ["/client/campaigns", "Campaigns", "bi-megaphone"],
    ["/client/leads", "Leads", "bi-person-lines-fill"],
    ["/client/sequences", "Sequences", "bi-diagram-3"],
    ["/client/billing", "Billing", "bi-receipt"],
    ["/client/profile", "Profile", "bi-person"]
  ]
};

const roleLabels = {
  manager: "Campaign Manager",
  executive: "Executive",
  client: "Client"
};

function SidebarContent({ role, pathname, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <div className="d-flex flex-column h-100 p-3">
      <div className="px-3 py-3 mb-4 mt-2 d-flex align-items-center gap-2">
        <div className="bg-primary bg-gradient text-white rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
          <i className="bi bi-activity fw-bold"></i>
        </div>
        <div>
          <div className="fw-bolder fs-5 tracking-tight text-white m-0 lh-1">LeadPulse</div>
          <div className="small text-white-50 mt-1 fw-medium" style={{ fontSize: '0.75rem' }}>{roleLabels[role]}</div>
        </div>
      </div>

      <nav className="nav nav-pills flex-column gap-2 px-2">
        {nav[role].map(([href, label, icon]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link fw-medium d-flex align-items-center rounded-3 px-3 py-2 ${active ? "active shadow-sm" : "text-white-50 hover-bg"}`}
              onClick={onNavigate}
              style={{ transition: 'all 0.2s' }}
            >
              <i className={`bi ${icon} me-3 fs-5`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-top border-white-10 px-2">
        <div className="d-flex align-items-center bg-white bg-opacity-10 p-3 rounded-3 mb-3">
          <div className="bg-primary bg-opacity-25 text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{ width: '36px', height: '36px' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="overflow-hidden">
            <div className="text-white fw-semibold small text-truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-white-50 small text-truncate" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
          </div>
        </div>
        <Button
          variant="outline-light"
          size="sm"
          className="w-100 border-0 bg-white bg-opacity-10 hover-bg-danger rounded-3 py-2 fw-medium"
          onClick={logout}
        >
          <i className="bi bi-box-arrow-right me-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export default function AppLayout({ role, children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell d-flex">
      <aside className="app-sidebar d-none d-md-block">
        <SidebarContent role={role} pathname={pathname} />
      </aside>

      <Offcanvas
        show={mobileOpen}
        onHide={() => setMobileOpen(false)}
        className="app-sidebar"
      >
        <Offcanvas.Body className="p-0">
          <SidebarContent
            role={role}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="app-main">
        <header className="app-topbar d-flex align-items-center px-3 px-md-4">
          <Button
            variant="outline-secondary"
            className="d-md-none me-3"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <i className="bi bi-list" />
          </Button>
          <div className="small text-secondary">LeadPulse Workspace</div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
