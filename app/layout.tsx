import type { Metadata, Viewport } from 'next';
import './globals.css';

const BASE_URL = 'https://systracker.rico.bd';
const OG_IMAGE = `${BASE_URL}/banner.svg`;

export const viewport: Viewport = {
    themeColor: '#2563eb',
    colorScheme: 'light',
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: 'SysTracker — Self-Hosted Windows Fleet Monitoring',
        template: '%s | SysTracker',
    },
    description:
        'SysTracker is a free, self-hosted Remote Monitoring & Management (RMM) tool for Windows fleets. Real-time CPU, RAM, disk, network telemetry, hardware inventory, and Windows Event Logs — all on your own infrastructure.',
    keywords: [
        'SysTracker',
        'RMM',
        'remote monitoring management',
        'self-hosted monitoring',
        'Windows fleet monitoring',
        'system monitoring tool',
        'CPU RAM monitoring',
        'network monitoring',
        'hardware inventory',
        'Windows Event Logs',
        'server monitoring',
        'proprietary RMM tool',
        'free RMM tool',
        'IT monitoring software',
        'real-time telemetry',
        'Windows agent',
        'Socket.IO monitoring',
        'self-hosted dashboard',
        'endpoint monitoring',
        'infrastructure monitoring',
    ],
    authors: [{ name: 'RedwanCodes', url: 'https://systracker.rico.bd' }],
    creator: 'RedwanCodes',
    publisher: 'SysTracker',
    category: 'technology',
    applicationName: 'SysTracker',
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/logo.svg', type: 'image/svg+xml' },
        ],
        shortcut: '/favicon.ico',
        apple: [{ url: '/logo.png', sizes: '512x512', type: 'image/png' }],
    },
    openGraph: {
        title: 'SysTracker — Self-Hosted Windows Fleet Monitoring',
        description:
            'Free, self-hosted RMM tool for Windows fleets. Real-time CPU, RAM, disk & network telemetry, hardware inventory, and Windows Event Logs — all on your own server.',
        type: 'website',
        url: BASE_URL,
        siteName: 'SysTracker',
        locale: 'en_US',
        images: [
            {
                url: OG_IMAGE,
                width: 1200,
                height: 630,
                alt: 'SysTracker — Self-Hosted Windows Fleet Monitoring Dashboard',
                type: 'image/svg+xml',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SysTracker — Self-Hosted Windows Fleet Monitoring',
        description:
            'Free self-hosted RMM: real-time CPU, RAM, disk & network monitoring for Windows fleets. Deploy in minutes.',
        images: [{ url: OG_IMAGE, alt: 'SysTracker Dashboard Banner' }],
        creator: '@SysTracker',
        site: '@SysTracker',
    },
    alternates: {
        canonical: BASE_URL,
    },
    // verification: { google: 'YOUR_GOOGLE_VERIFICATION_TOKEN' },
};

const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            '@id': `${BASE_URL}/#website`,
            url: BASE_URL,
            name: 'SysTracker',
            description: 'Self-hosted Windows Fleet Monitoring & RMM Tool',
            publisher: { '@id': `${BASE_URL}/#organization` },
        },
        {
            '@type': 'Organization',
            '@id': `${BASE_URL}/#organization`,
            name: 'SysTracker',
            url: BASE_URL,
            logo: {
                '@type': 'ImageObject',
                url: `${BASE_URL}/logo.png`,
                width: 512,
                height: 512,
            },
            contactPoint: {
                '@type': 'ContactPoint',
                email: 'SysTracker@rico.bd',
                contactType: 'customer support',
            },
            sameAs: ['https://github.com/Redwan002117/SysTracker'],
        },
        {
            '@type': 'SoftwareApplication',
            '@id': `${BASE_URL}/#software`,
            name: 'SysTracker',
            applicationCategory: 'BusinessApplication',
            applicationSubCategory: 'Network Monitoring',
            operatingSystem: 'Windows, Linux',
            url: BASE_URL,
            description:
                'Self-hosted Remote Monitoring & Management (RMM) tool for Windows fleets. Real-time CPU, RAM, disk, and network telemetry with hardware inventory and Windows Event Logs.',
            screenshot: OG_IMAGE,
            softwareVersion: '3.2.1',
            releaseNotes: `${BASE_URL}/terms`,
            author: { '@id': `${BASE_URL}/#organization` },
            publisher: { '@id': `${BASE_URL}/#organization` },
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                description: 'Free for personal and non-commercial use',
            },
            featureList: [
                'Real-time CPU, RAM, disk, and network monitoring',
                'Hardware inventory with serial numbers',
                'Windows Event Log collection',
                'Process monitoring with PID and CPU%',
                'Remote shutdown and restart',
                'Fleet overview dashboard',
                'JWT authentication',
                'Self-hosted — your data stays on your server',
            ],
            downloadUrl: `${BASE_URL}/download`,
            installUrl: `${BASE_URL}/download`,
            isAccessibleForFree: true,
        },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                {children}
                {/* JSON-LD Structured Data — Next.js App Router pattern */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            </body>
        </html>
    );
}
