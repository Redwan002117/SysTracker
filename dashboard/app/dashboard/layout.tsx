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
            <div className="min-h-screen pb-10 pt-16" style={{background: 'linear-gradient(135deg, #EEF3FF 0%, #F5F0FF 40%, #FFF0F5 80%, #F0F7FF 100%)', backgroundAttachment: 'fixed'}}>
                <TopBar />
                {children}
            </div>
        </AuthGuard>
    );
}
