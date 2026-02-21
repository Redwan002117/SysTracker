import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data Retention Policy',
    description:
        'SysTracker Data Retention Policy. Understand how telemetry metrics, event logs, and hardware profiles accumulate in your self-hosted SQLite database and best practices for managing retention.',
    alternates: {
        canonical: 'https://systracker.rico.bd/data-retention',
    },
    openGraph: {
        title: 'Data Retention Policy | SysTracker',
        description:
            'How SysTracker stores telemetry data and best practices for managing your self-hosted database retention.',
        url: 'https://systracker.rico.bd/data-retention',
        images: [{ url: 'https://systracker.rico.bd/banner.svg', width: 1200, height: 630, alt: 'SysTracker' }],
    },
    twitter: {
        title: 'Data Retention Policy | SysTracker',
        description: 'Manage telemetry and event log retention in your self-hosted SysTracker deployment.',
    },
};

export default function DataRetentionLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
