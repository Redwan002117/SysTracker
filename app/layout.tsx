import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'SysTracker — Real-Time System Monitoring',
    description: 'Download SysTracker, the self-hosted real-time system monitoring tool for Windows. Monitor CPU, RAM, disk, network, and more across your entire fleet.',
    keywords: ['system monitoring', 'RMM', 'Windows monitoring', 'self-hosted', 'SysTracker'],
    authors: [{ name: 'SysTracker' }],
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/logo.png', // Using logo.png
    },
    openGraph: {
        title: 'SysTracker — Real-Time System Monitoring',
        description: 'Self-hosted real-time monitoring for your entire fleet. Download for Windows or deploy with Docker.',
        type: 'website',
        url: 'https://systracker.rico.bd/',
        siteName: 'SysTracker',
        images: [
            {
                url: '/banner.svg',
                width: 1200,
                height: 630,
                alt: 'SysTracker Banner',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SysTracker — Real-Time System Monitoring',
        description: 'Self-hosted real-time monitoring for your entire fleet.',
        images: ['/banner.svg'],
    },
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
            <body>{children}</body>
        </html>
    );
}
