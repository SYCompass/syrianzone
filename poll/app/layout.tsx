import "./globals.css";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Alexandria } from "next/font/google";
import { ReactNode } from "react";

export const metadata = {
  title: "تقييم الوزراء",
  description: "Vote S–F tiers for ministers",
};

const alexandria = Alexandria({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-alexandria",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${alexandria.variable} bg-gray-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100`}>
        <div className="container mx-auto px-4 py-4 flex justify-end"><ThemeToggle /></div>
        {children}
        {/* Turnstile hidden input for token retrieval */}
        <input id="cf-turnstile-token" type="hidden" />
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
        <div
          className="hidden"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-callback="(t)=>{const el=document.getElementById('cf-turnstile-token'); if(el) el.value=t;}"
        />
      </body>
    </html>
  );
}


