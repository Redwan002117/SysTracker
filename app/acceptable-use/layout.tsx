import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Acceptable Use Policy',
    description:
        'SysTracker Acceptable Use Policy. Understand what constitutes acceptable use of this self-hosted monitoring platform, including consent requirements, prohibited surveillance uses, and compliance obligations.',
    alternates: {
        canonical: 'https://systracker.rico.bd/acceptable-use',
    },
    openGraph: {
        title: 'Acceptable Use Policy | SysTracker',
        description:
            'SysTracker Acceptable Use Policy — consent requirements, prohibited uses, and compliance obligations for administrators.',
        url: 'https://systracker.rico.bd/acceptable-use',
        images: [{ url: 'https://systracker.rico.bd/banner.svg', width: 1200, height: 630, alt: 'SysTracker' }],
    },
    twitter: {
        title: 'Acceptable Use Policy | SysTracker',
        description: 'Acceptable use, consent requirements, and compliance obligations for SysTracker administrators.',
    },
};

export default function AcceptableUseLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
