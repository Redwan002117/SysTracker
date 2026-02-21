import type { Metadata } from 'next';
import TopBar from '../../components/TopBar';
import AuthGuard from '../../components/AuthGuard';

export const metadata: Metadata = {
    title: 'Fleet Overview',
    description: 'Monitor your Windows fleet — real-time CPU, RAM, disk, and network metrics across all connected machines.',
    robots: { index: false, follow: false },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50/50 pb-10 pt-16">
                <TopBar />
                {children}
            </div>
        </AuthGuard>
    );
}
