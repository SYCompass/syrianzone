import type React from "react"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const cairo = Cairo({
  subsets: ["latin", "arabic"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  fallback: ["Arial", "sans-serif"],
})

export const metadata: Metadata = {
  title: "أفضل المساهمين في GitHub - سوريا",
  description: "لوحة متصدرين للمطورين السوريين المساهمين في المصادر المفتوحة",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={cairo.className} style={{ fontFamily: `${cairo.style.fontFamily}, Arial, sans-serif` }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
