import type { Metadata } from 'next';
import TopBar from '../../components/TopBar';
import Sidebar from '../../components/Sidebar';
import AuthGuard from '../../components/AuthGuard';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

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
                <Sidebar />
                <div className="md:pl-64">
                    {children}
                </div>

                <Link
                    href="/dashboard/chat"
                    className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-110 transition-all duration-300 group"
                    aria-label="Open chat"
                >
                    <MessageCircle size={24} className="group-hover:scale-110 transition-transform duration-300" />
                </Link>
            </div>
        </AuthGuard>
    );
}
