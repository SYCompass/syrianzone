import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Footer from "@/components/Footer"
import Script from "next/script"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "nav-bar": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

export const metadata: Metadata = {
  title: "أفضل المساهمين في GitHub - سوريا",
  description: "لوحة متصدرين للمطورين السوريين المساهمين في المصادر المفتوحة",
}

const BASE_PATH = "/syrian-contributors"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" data-base-path={BASE_PATH}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@100;200;300;400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          integrity="sha512-o8nXKBnBKYmU27YDDdjRq4u0cY7L9egRW7k+1OYdPnLjxZXIFY4mMwh3G+yEGcO00JgCsu6lwNz8xCPavYeXPw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link rel="stylesheet" href="/styles/theme.css" />
        <link rel="stylesheet" href="/styles/output.css" />
      </head>
      <body style={{ fontFamily: `'Cairo', Arial, sans-serif` }}>
        <Script src="/components/navbar.js" strategy="afterInteractive" />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <nav-bar base-path={BASE_PATH} asset-base="/"></nav-bar>
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
