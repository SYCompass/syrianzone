"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
  useImageIcon?: boolean;
  imageSrc?: string;
};

export default function NavBar(): React.ReactElement {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "") as string;

  const items: NavItem[] = useMemo(
    () => [
      { label: "الحسابات الرسمية", href: "https://syrian.zone/syofficial", external: false, icon: <i className="fas fa-check-circle" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "الهوية البصرية", href: "https://syrian.zone/syid", external: false, icon: <i className="fas fa-palette" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "دليل الأحزاب", href: "https://syrian.zone/party", external: false, icon: <i className="fas fa-users" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "تير ليست الحكومة", href: "https://syrian.zone/tierlist", external: false, icon: <i className="fas fa-list-ol" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "المجلس التشريعي", href: "https://syrian.zone/house", external: false, icon: <i className="fas fa-landmark" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "البوصلة السياسية", href: "https://syrian.zone/compass", external: false, icon: <i className="fas fa-compass" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "بوصلة مخصصة", href: "https://syrian.zone/alignment", external: false, icon: <i className="fas fa-crosshairs" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "المواقع السورية", href: "https://syrian.zone/sites", external: false, icon: <i className="fas fa-globe" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "المساهمون السوريون", href: "https://syrian.zone/syrian-contributors", external: false, icon: <i className="fas fa-code" style={{ color: "var(--sz-color-ink)" }} /> },
      { label: "مبدل العلم", href: "https://github.com/SYCompass/Twitter-SVG-Syrian-Flag-Replacer/releases/tag/1.0.1", external: true, useImageIcon: true, imageSrc: "/assets/logo-lightmode.svg" },
      { label: "المنتدى", href: "https://wrraq.com", external: true, icon: <i className="fas fa-comments" style={{ color: "var(--sz-color-accent)" }} /> },
    ],
    []
  );

  const primaryItems = useMemo(() => items.slice(0, Math.max(0, items.length - 2)), [items]);
  const secondaryItems = useMemo(() => items.slice(-2), [items]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const activeLabel = "";

  return (
    <div className="nav-root">
      <nav className={`navbar ${menuOpen ? "menu-open" : ""}`}>
        <div className="container">
          <div className="mobile-header">
            <a href="/tierlist" className="logo">
              <img src="/tierlist/assets/logo-lightmode.svg" alt="Syrian Zone" />
            </a>
            <div className="mobile-actions">
              <div className="mobile-title">
                {activeLabel ? (
                  <>
                    <i className="fas fa-circle" style={{ color: "var(--sz-color-primary)" }} />
                    <span>{activeLabel}</span>
                  </>
                ) : null}
              </div>
              <button className={`menu-button ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
                <i className="fas fa-bars" />
              </button>
            </div>
          </div>

          <div className={`nav-items ${menuOpen ? "show" : ""}`}>
            <div className="desktop-logo">
              <a href="/tierlist" className="logo">
                <img src="/tierlist/assets/logo-lightmode.svg" alt="Syrian Zone" style={{ height: "50px" }} />
              </a>
            </div>

            <div className="nav-row primary">
            {primaryItems.map((item) => {
              // Determine active state for absolute or relative links
              let itemPath = item.href;
              try {
                if (/^https?:\/\//.test(item.href)) {
                  itemPath = new URL(item.href).pathname;
                }
              } catch {}
              const currentFullPath = `${basePath}${pathname || ""}`;
              const isActive = !item.external && (
                (itemPath === "/" && currentFullPath === `${basePath}/`) ||
                (itemPath !== "/" && (currentFullPath === itemPath || currentFullPath.startsWith(itemPath)))
              );

              const className = `nav-item ${isActive ? "active" : ""}`;

              if (item.external) {
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener" className={className}>
                    {item.useImageIcon ? (
                      <img src="/tierlist/flag-replacer/1f1f8-1f1fe.svg" alt="Flag Replacer" style={{ height: "1.1rem", width: "1.1rem", marginLeft: "0.5rem" }} />
                    ) : (
                      <span className="icon-wrap">{item.icon}</span>
                    )}
                    {item.label}
                  </a>
                );
              }

              return (
                <Link key={item.label} href={item.href} className={className} prefetch={false}>
                  <span className="icon-wrap">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            </div>

            <div className="nav-row secondary">
            {secondaryItems.map((item) => {
              const className = `nav-item`;
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noopener" className={className}>
                  {item.useImageIcon ? (
                    <img src="/tierlist/flag-replacer/1f1f8-1f1fe.svg" alt="Flag Replacer" style={{ height: "1rem", width: "1rem", marginLeft: "0.4rem" }} />
                  ) : (
                    <span className="icon-wrap">{item.icon}</span>
                  )}
                  {item.label}
                </a>
              );
            })}
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .nav-root {
          display: block;
          font-family: var(--font-alexandria, system-ui), sans-serif;
          direction: rtl;
        }
        .navbar {
          background-color: var(--sz-color-surface);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid color-mix(in oklab, var(--sz-color-ink) 10%, transparent);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1000;
        }
        .navbar.menu-open { box-shadow: none; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0.5rem 1rem; }
        .nav-items { position: relative; }
        .nav-row { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
        .nav-item {
          display: flex; align-items: center; text-decoration: none;
          color: var(--sz-color-ink); padding: 0.5rem 0.75rem; border-radius: 0.5rem;
          transition: all 0.2s; font-size: 0.95rem;
        }
        .nav-item:hover { background-color: color-mix(in oklab, var(--sz-color-ink) 5%, transparent); }
        .nav-item.active {
          background-color: color-mix(in oklab, var(--sz-color-primary) 12%, white);
          color: var(--sz-color-primary); font-weight: 500;
        }
        .nav-row.secondary .nav-item { font-size: 0.85rem; padding: 0.35rem 0.5rem; }
        .icon-wrap { margin-left: 0.5rem; width: 1.25rem; height: 1.25rem; display: inline-flex; align-items: center; justify-content: center; }
        .icon-wrap :global(i) { font-size: 1.1rem; line-height: 1; vertical-align: middle; display: inline-block; }
        .menu-button {
          display: none; background: none; border: none; cursor: pointer; padding: 0.5rem;
          color: var(--sz-color-ink); width: 2.5rem; height: 2.5rem; border-radius: 0.5rem;
        }
        .menu-button:hover { background-color: color-mix(in oklab, var(--sz-color-ink) 5%, transparent); }
        .menu-button :global(i) { font-size: 1.25rem; }
        .mobile-header { display: none; }
        @media (max-width: 768px) {
          .navbar { position: fixed; top: 0; right: 0; left: 0; }
          .nav-root { margin-bottom: 4rem; }
          .mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 0.25rem; position: relative; }
          .mobile-title { display: flex; align-items: center; font-weight: 500; color: var(--sz-color-primary); font-size: 1rem; }
          .mobile-title :global(i) { margin-left: 0.5rem; }
          .logo { display: flex; align-items: center; text-decoration: none; color: var(--sz-color-primary); font-weight: 600; font-size: 1.1rem; }
          .logo img { height: 2rem; width: auto; margin-left: 0.5rem; }
          .desktop-logo { display: none; }
          .mobile-actions { display: flex; align-items: center; gap: 0.5rem; position: relative; }
          .menu-button { display: flex; align-items: center; justify-content: center; }
          .nav-items { display: none; flex-direction: column; gap: 0.5rem; position: absolute; top: 100%; right: 0; left: 0; background-color: var(--sz-color-surface); padding: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .nav-items.show { display: flex; }
          .nav-row { display: flex; flex-direction: column; gap: 0.25rem; }
          .nav-item { padding: 0.75rem; width: 100%; justify-content: flex-start; border-radius: 0.375rem; }
          .nav-row.secondary .nav-item { font-size: 0.9rem; }
          .nav-item.active { background-color: color-mix(in oklab, var(--sz-color-primary) 12%, white); }
          .container { padding: 0 0.5rem; }
        }
        @media (min-width: 769px) {
          .desktop-logo { display: flex; align-items: center; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); margin: 0; }
          .nav-items { padding-right: 4.5rem; }
          .nav-row.primary { margin-bottom: .60rem; }
          .mobile-title { display: none; }
        }
      `}</style>
    </div>
  );
}

