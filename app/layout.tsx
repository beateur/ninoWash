import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/hooks/use-auth"
import { Toaster } from "@/components/ui/toaster"
import { CookieBanner } from "@/components/gdpr/cookie-banner"
import { FacebookPixelScript } from "@/components/analytics/facebook-pixel-script"
import { FacebookPixel } from "@/components/analytics/facebook-pixel"
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nino Wash",
  },
  icons: {
    apple: "/apple-touch-icon.jpg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <FacebookPixelScript />
      </head>
      <body className="font-sans antialiased">
        <FacebookPixel />
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
