import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Download SysTracker',
    description:
        'Download SysTracker v3.2.1 for Windows. Install the agent with one PowerShell command, or deploy the server via Docker. Free self-hosted RMM for Windows fleet monitoring.',
    keywords: [
        'download SysTracker',
        'SysTracker Windows agent',
        'SysTracker installer',
        'RMM download',
        'Windows monitoring agent install',
        'self-hosted monitoring download',
    ],
    alternates: {
        canonical: 'https://systracker.rico.bd/download',
    },
    openGraph: {
        title: 'Download SysTracker — Free Windows Fleet Monitoring',
        description:
            'Download SysTracker v3.2.1. One-line PowerShell agent install or Docker server deployment. Monitor your entire Windows fleet in minutes.',
        url: 'https://systracker.rico.bd/download',
        images: [{ url: 'https://systracker.rico.bd/banner.svg', width: 1200, height: 630, alt: 'Download SysTracker' }],
    },
    twitter: {
        title: 'Download SysTracker — Free Windows Fleet Monitoring',
        description: 'One-line install. Monitor your entire Windows fleet in minutes. Free & self-hosted.',
    },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
