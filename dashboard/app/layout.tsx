import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SysTracker Dashboard",
  description: "Monitor your infrastructure in real-time.",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png', // Using logo.png
  },
  openGraph: {
    title: 'SysTracker Dashboard',
    description: 'Monitor your infrastructure in real-time.',
    url: 'https://systracker.rico.bd/',
    siteName: 'SysTracker',
    images: [
      {
        url: '/banner.svg', // OpenGraph Image
        width: 1200,
        height: 630,
        alt: 'SysTracker Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SysTracker Dashboard',
    description: 'Monitor your infrastructure in real-time.',
    images: ['/banner.svg'], // Twitter Image
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
