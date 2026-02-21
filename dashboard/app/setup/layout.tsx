import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Setup',
    description: 'Initial setup wizard for your SysTracker server. Create your admin account and configure your deployment.',
    robots: { index: false, follow: false },
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
