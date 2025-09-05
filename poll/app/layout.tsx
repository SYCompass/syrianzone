import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "تقييم الوزراء",
  description: "Vote S–F tiers for ministers",
};

const ibmPlex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["100","200","300","400","500","600","700"],
  variable: "--font-ibm-plex-sans-arabic",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={ibmPlex.variable}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      </head>
      <body className={`bg-gray-100 text-neutral-900`}>
        <ThemeProvider>
          <NavBar />
          <div className="container mx-auto px-4 py-4 flex justify-end gap-2 items-center">
            <Button asChild variant="outline">
              <Link href="/">تير ليست</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/leaderboard">قائمة الصدارة</Link>
            </Button>
          </div>
          {children}
          <Footer />
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


