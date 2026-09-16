"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M2 9l5-6 3 3.5L14 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 14h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  airport: (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M2 8l12-4-4 12-2-5-5-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  catalog: (
    <svg viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  commission: (
    <svg viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 4V2.5M11 4V2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  vehicle: (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M2 10l1.2-4.2A1.5 1.5 0 014.6 4.7h6.8a1.5 1.5 0 011.4 1L14 10" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <rect x="1.5" y="10" width="13" height="2.6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="4.6" cy="12.8" r="1.1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11.4" cy="12.8" r="1.1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  article: (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M2 5l6-3 6 3-6 3-6-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M2 5v6l6 3 6-3V5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  movement: (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M2 5h9M11 5l-2.2-2.2M11 5l-2.2 2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11H5M5 11l2.2-2.2M5 11l2.2 2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  maintenance: (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M2 8a6 6 0 0110.9-3.4L14 3v4h-4l1.3-1.3A4.3 4.3 0 104.3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  technician: (
    <svg viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.2" r="2.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 14c.6-3 2.7-4.5 5.5-4.5s4.9 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: "/", label: "Dashboard", icon: ICONS.dashboard }] },
  {
    label: "Infraestructura",
    items: [
      { href: "/aeropuertos", label: "Aeropuertos", icon: ICONS.airport },
      { href: "/catalogo", label: "Catálogo de modelos", icon: ICONS.catalog },
    ],
  },
  {
    label: "Logística",
    items: [
      { href: "/comisiones", label: "Comisiones", icon: ICONS.commission },
      { href: "/vehiculos", label: "Vehículos", icon: ICONS.vehicle },
    ],
  },
  {
    label: "Inventario",
    items: [
      { href: "/articulos", label: "Artículos", icon: ICONS.article },
      { href: "/movimientos", label: "Movimientos", icon: ICONS.movement },
    ],
  },
  {
    label: "Trabajo diario",
    items: [
      { href: "/mantenimiento", label: "Mantenimiento", icon: ICONS.maintenance },
      { href: "/tickets", label: "Tickets", icon: ICONS.ticket },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/tecnicos", label: "Técnicos", icon: ICONS.technician },
      { href: "/auditoria", label: "Auditoría", icon: ICONS.audit },
    ],
  },
];

export function AppShell({
  children,
  userLabel,
  userRole,
}: {
  children: React.ReactNode;
  userLabel: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [railOpen, setRailOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const closeRail = () => setRailOpen(false);

  return (
    <div className="shell">
      <nav className={`rail${railOpen ? " open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            RADIO<span>AYUDAS</span>
          </div>
          <div className="brand-sub">Trazabilidad · Infraestructura ANAC</div>
        </div>

        {NAV_GROUPS.map((group, i) => (
          <div className="nav-group" key={i}>
            {group.label && <div className="nav-label">{group.label}</div>}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${isActive(item.href) ? " active" : ""}`}
                onClick={closeRail}
              >
                <span className="nav-ico">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="rail-foot">
          <div className="kv">
            <span className="k">Sesión</span>
            <span className="v">{userLabel}</span>
          </div>
          <SignOutButton />
        </div>
      </nav>

      {railOpen && <div className="rail-backdrop open" onClick={closeRail} />}

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setRailOpen((o) => !o)}
              title="Menú"
              aria-label="Abrir menú"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className="btn-back-icon"
              onClick={() => router.back()}
              title="Volver a la pantalla anterior"
            >
              ‹
            </button>
          </div>
          <div className="role-note">
            Sesión de <b>{userLabel}</b> — rol {userRole}.
          </div>
        </div>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}
