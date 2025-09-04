"use client";
import React from "react";

export default function Footer(): React.JSX.Element {
  return (
    <footer className="footer py-6 mt-12 w-full">
      <div className="container mx-auto px-4 text-center">
        <p dir="ltr" className="text-[var(--sz-color-ink)]">
         <a href="https://syrian.zone" target="_blank" rel="noopener">تير ليست الوزراء | Ministers Tier List 2025 &copy;</a>
        </p>
        <p className="mt-2 text-sm text-[var(--sz-color-ink)]">
          تم التطوير بواسطة <span className="font-semibold">هادي الأحمد</span>
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <a href="http://hadealahmad.com/" target="_blank" rel="noopener" className="flex items-center">
            <i className="fas fa-globe ml-1" /> الموقع الشخصي
          </a>
          <a href="https://x.com/hadealahmad" target="_blank" rel="noopener" className="flex items-center">
            <i className="fab fa-x-twitter ml-1" /> حساب
          </a>
        </div>
      </div>
      <style jsx>{`
        .footer-link { color: var(--sz-color-primary); text-decoration: none; }
        .footer-link:hover { text-decoration: underline; }
      `}</style>
    </footer>
  );
}


