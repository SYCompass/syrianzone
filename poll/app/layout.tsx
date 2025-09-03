import "./globals.css";
import { Alexandria } from "next/font/google";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "تقييم الوزراء",
  description: "Vote S–F tiers for ministers",
};

const alexandria = Alexandria({
  subsets: ["arabic"],
  weight: ["100","200","300","400","500","600","700","800","900"],
  variable: "--font-alexandria",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={alexandria.variable}>
      <body className={`bg-gray-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100`}>
        <ThemeProvider>
          <div className="container mx-auto px-4 py-4 flex justify-end gap-2 items-center">
            <Button asChild variant="outline">
              <Link href="/">تيرليست</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/leaderboard">لوحة الصدارة</Link>
            </Button>
          </div>
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
        </ThemeProvider>
      </body>
    </html>
  );
}


