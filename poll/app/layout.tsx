import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ReactNode } from "react";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import CustomNavBar from "@/components/CustomNavBar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "تقييم الحكومة",
  description: "Vote S–F tiers for ministers",
};

const ibmPlex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["100","200","300","400","500","600","700"],
  variable: "--font-ibm-plex-sans-arabic",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${ibmPlex.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
        <link rel="icon" href="/assets/favicon.png" type="image/png" />
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var ls = window.localStorage;
              var stored = ls.getItem('theme');
              var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var theme = (stored === 'light' || stored === 'dark') ? stored : (systemDark ? 'dark' : 'light');
              var root = document.documentElement;
              root.classList.remove('light','dark');
              root.classList.add(theme);
              root.style.colorScheme = theme;
            } catch (e) {}
          })();
        `}</Script>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-K4H98TC203" strategy="afterInteractive" />
        <Script id="ga-gtag" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-K4H98TC203');
        `}</Script>
      </head>
      <body className={`bg-gray-100 text-neutral-900 dark:bg-[#0D1315] dark:text-neutral-100`}>
        <ThemeProvider>
          <CustomNavBar />
          <div className="container mx-auto px-4 py-4 flex justify-end gap-2 items-center">
            <Button asChild variant="outline">
              <Link href="/tierlist">التصنيف</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tierlist/leaderboard">الإحصائيات</Link>
            </Button>
          </div>
          {children}
          <Footer />
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


