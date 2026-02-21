import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description:
        'SysTracker Privacy Policy. Learn what data the SysTracker agent collects, how it is stored on your self-hosted server, and your responsibilities as the data controller under GDPR, CCPA, and PDPA.',
    alternates: {
        canonical: 'https://systracker.rico.bd/privacy',
    },
    openGraph: {
        title: 'Privacy Policy | SysTracker',
        description:
            'SysTracker is fully self-hosted — all collected data stays on your server. Learn what is collected and how to comply with privacy regulations.',
        url: 'https://systracker.rico.bd/privacy',
        images: [{ url: 'https://systracker.rico.bd/banner.svg', width: 1200, height: 630, alt: 'SysTracker' }],
    },
    twitter: {
        title: 'Privacy Policy | SysTracker',
        description: 'Your data stays on your server. SysTracker Privacy Policy explained.',
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
