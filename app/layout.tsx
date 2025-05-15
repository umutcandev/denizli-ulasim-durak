import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { FontProvider } from "@/components/font-provider"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export const metadata: Metadata = {
  title: "Denizli Akıllı Durak | Otobüs Bilgi Sistemi",
  description:
    "Denizli Büyükşehir Belediyesi Akıllı Durak Sistemi ile otobüs saatlerini öğrenin. Durak numarasını girerek otobüslerin ne zaman geleceğini kolayca takip edin.",
  keywords: ["denizli", "akıllı durak", "otobüs", "durak", "toplu taşıma", "denizli belediyesi", "otobüs saatleri"],
  authors: [{ name: "umutcandev", url: "https://github.com/umutcandev" }],
  creator: "umutcandev",
  publisher: "Denizli Büyükşehir Belediyesi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://akillidurak.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Denizli Akıllı Durak | Otobüs Bilgi Sistemi",
    description: "Denizli Büyükşehir Belediyesi Akıllı Durak Sistemi ile otobüs saatlerini öğrenin.",
    url: "https://akillidurak.vercel.app",
    siteName: "Denizli Akıllı Durak",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Denizli Akıllı Durak | Otobüs Bilgi Sistemi",
    description: "Denizli Büyükşehir Belediyesi Akıllı Durak Sistemi ile otobüs saatlerini öğrenin.",
    creator: "@umutcandev",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png" }],
  },
  appleWebApp: {
    title: "Denizli Akıllı Durak",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={GeistSans.className}>
        <FontProvider />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
