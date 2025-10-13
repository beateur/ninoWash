import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/hooks/use-auth"
import { Toaster } from "@/components/ui/toaster"
import { CookieBanner } from "@/components/gdpr/cookie-banner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Nino Wash - Pressing à domicile",
  description:
    "Service de collecte, nettoyage, repassage et livraison de vos vêtements. Le pressing qui vient à vous.",
  generator: "Nino Wash",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nino Wash",
  },
  icons: {
    apple: "/apple-touch-icon.jpg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
        </AuthProvider>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  )
}
