// src/components/admin/AdminHeader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/modules/auth/actions/auth.actions";
import { NotificationBell } from "./NotificationBell";

type AdminPage = "dashboard" | "eventos" | "registrados" | "usuarios";

interface NavItem {
  href: string;
  label: string;
  page: AdminPage;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    page: "dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z"
        />
      </svg>
    ),
  },
  {
    href: "/admin/eventos",
    label: "Eventos",
    page: "eventos",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    href: "/admin/registrados",
    label: "Registrados",
    page: "registrados",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    page: "usuarios",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export function AdminHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Lock body scroll when menu is open on mobile
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const currentPage = pathname?.split("/")[2] as AdminPage | undefined;

  return (
    <>
      {/* ──────────────────────────────────────── */}
      {/* HEADER BAR                               */}
      {/* ──────────────────────────────────────── */}
      <header
        ref={menuRef}
        className="sticky top-0 z-40 w-full max-w-lg"
      >
        {/* Main bar */}
        <div className="bg-brand-navy/85 backdrop-blur-md border-b border-brand-blue/35 px-4 py-3 flex items-center justify-between">
          
          {/* ── Logo + Título ── */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-sky flex items-center justify-center font-bold text-sm text-brand-navy shadow-md shadow-brand-sky/20 shrink-0">
              AD
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold tracking-tight text-white leading-none">
                Admin Panel
              </p>
              <span className="text-[10px] text-brand-sky/60 font-medium uppercase tracking-wide">
                CI Ingeniería Informática
              </span>
            </div>
          </div>

          {/* ── Right side: desktop nav + hamburger ── */}
          <div className="flex items-center gap-3">

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden sm:flex items-center gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPage === item.page;
                return (
                  <Link
                    key={item.page}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] flex items-center ${
                      isActive
                        ? "text-brand-sky bg-brand-sky/10 border border-brand-sky/25 pointer-events-none"
                        : "text-brand-sky/70 hover:text-brand-sky hover:bg-brand-blue/20 border border-transparent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop logout — hidden on mobile */}
            <form action={logoutAction} className="hidden sm:block">
              <button
                type="submit"
                className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-sky/70 hover:text-white bg-brand-dark/60 border border-brand-blue/30 hover:bg-brand-blue/60 active:scale-95 transition-all min-h-[32px] cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </form>

            {/* Campana de Notificaciones Push */}
            <NotificationBell />

            {/* ── Hamburger button — only on mobile ── */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              className="sm:hidden relative w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/30 flex flex-col items-center justify-center gap-[5px] transition-all hover:bg-brand-blue/30 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
            >
              {/* Three bars animated → X */}
              <span
                className={`block w-4.5 h-[1.5px] bg-brand-sky rounded-full transition-all duration-300 origin-center ${
                  menuOpen ? "rotate-45 translate-y-[6.5px]" : ""
                }`}
                style={{ width: "18px" }}
              />
              <span
                className={`block h-[1.5px] bg-brand-sky rounded-full transition-all duration-300 ${
                  menuOpen ? "opacity-0 scale-x-0" : "opacity-100"
                }`}
                style={{ width: "14px" }}
              />
              <span
                className={`block h-[1.5px] bg-brand-sky rounded-full transition-all duration-300 origin-center ${
                  menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""
                }`}
                style={{ width: "18px" }}
              />
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown panel ── */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="bg-brand-navy/95 backdrop-blur-xl border-b border-brand-blue/30 px-3 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Link
                  key={item.page}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] min-h-[48px] ${
                    isActive
                      ? "bg-gradient-to-r from-brand-sky/20 to-brand-blue/10 text-white border border-brand-sky/25"
                      : "text-brand-sky/70 hover:text-white hover:bg-brand-blue/20 border border-transparent"
                  }`}
                >
                  <span
                    className={`shrink-0 transition-colors ${
                      isActive ? "text-brand-sky" : "text-brand-sky/50"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-sky animate-pulse shrink-0" />
                  )}
                </Link>
              );
            })}

            {/* Divisor */}
            <div className="my-1 border-t border-brand-blue/20" />

            {/* Logout in mobile menu */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-[0.98] min-h-[48px] cursor-pointer"
              >
                <span className="shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </span>
                <span>Cerrar Sesión</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Full-screen overlay to close menu on outside tap (mobile) */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-30 bg-brand-navy/30 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
