import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Use',
    description:
        'Read the SysTracker Terms of Use. Understand the SysTracker Proprietary License, permitted and prohibited uses, administrator responsibilities, and warranty disclaimer for this self-hosted monitoring tool.',
    alternates: {
        canonical: 'https://systracker.rico.bd/terms',
    },
    openGraph: {
        title: 'Terms of Use | SysTracker',
        description:
            'SysTracker Terms of Use — permitted uses, administrator responsibilities, and the SysTracker Proprietary License explained.',
        url: 'https://systracker.rico.bd/terms',
        images: [{ url: 'https://systracker.rico.bd/banner.svg', width: 1200, height: 630, alt: 'SysTracker' }],
    },
    twitter: {
        title: 'Terms of Use | SysTracker',
        description: 'SysTracker Terms of Use — permitted uses and administrator responsibilities.',
    },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
