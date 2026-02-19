import TopBar from '../../components/TopBar';
import AuthGuard from '../../components/AuthGuard';

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
