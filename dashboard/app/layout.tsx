import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = "https://systracker.rico.bd";
const OG_IMAGE = `${BASE_URL}/banner.svg`;

export const viewport: Viewport = {
  themeColor: "#2563eb",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SysTracker Dashboard",
    template: "%s — SysTracker",
  },
  description:
    "SysTracker admin dashboard. Monitor CPU, RAM, disk, network, hardware inventory, Windows Event Logs, and running processes across your entire Windows fleet in real time.",
  keywords: [
    "SysTracker dashboard",
    "fleet monitoring dashboard",
    "Windows monitoring admin",
    "RMM dashboard",
    "server monitoring admin panel",
    "real-time telemetry",
    "self-hosted admin dashboard",
  ],
  authors: [{ name: "RedwanCodes", url: BASE_URL }],
  creator: "RedwanCodes",
  publisher: "SysTracker",
  applicationName: "SysTracker Dashboard",
  generator: "Next.js",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
  },
  openGraph: {
    title: "SysTracker Dashboard — Fleet Monitoring",
    description:
      "Real-time Windows fleet monitoring. CPU, RAM, disk, network, hardware inventory, event logs — all in one self-hosted dashboard.",
    url: BASE_URL,
    siteName: "SysTracker",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "SysTracker Dashboard — Real-Time Fleet Monitoring",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SysTracker Dashboard — Real-Time Fleet Monitoring",
    description:
      "Self-hosted Windows fleet monitoring dashboard. CPU, RAM, disk, network and more.",
    images: [{ url: OG_IMAGE, alt: "SysTracker Dashboard" }],
    creator: "@SysTracker",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
