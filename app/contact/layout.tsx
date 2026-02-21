import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact & Support',
    description:
        'Get help with SysTracker — report bugs, request features, ask questions, or contact the team. Reach us via email, GitHub Issues, or GitHub Discussions.',
    alternates: {
        canonical: 'https://systracker.rico.bd/contact',
    },
    openGraph: {
        title: 'Contact & Support | SysTracker',
        description:
            'Report a bug, request a feature, or reach the SysTracker team. We\'re here to help.',
        url: 'https://systracker.rico.bd/contact',
        images: [{ url: 'https://systracker.rico.bd/banner.svg', width: 1200, height: 630, alt: 'SysTracker' }],
    },
    twitter: {
        title: 'Contact & Support | SysTracker',
        description: 'Report bugs, request features, or contact the SysTracker team.',
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
