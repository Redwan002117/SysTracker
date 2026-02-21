'use client';

import Link from 'next/link';
import PortfolioNavbar from '../../components/PortfolioNavbar';
import { ShieldCheck } from 'lucide-react';
import SiteFooter from '../../components/SiteFooter';

export default function PrivacyPolicy() {
    const lastUpdated = 'February 18, 2026';

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <PortfolioNavbar />
            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <ShieldCheck className="text-blue-600" size={28} />
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Privacy Policy</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                        <strong>Important:</strong> SysTracker is a self-hosted, on-premises monitoring tool. All data collected by agents is stored exclusively on <strong>your own infrastructure</strong>. We do not have access to, nor do we collect, any of your machine telemetry data.
                    </div>
                </div>

                <div className="prose prose-slate max-w-none space-y-10">
                    <Section title="1. Overview">
                        <p>SysTracker (&quot;the Software&quot;) is a proprietary, self-hosted remote monitoring and management (RMM) tool. This Privacy Policy explains what data the Software collects, how it is stored, and who has access to it. Because SysTracker is self-hosted, <strong>you are the data controller</strong> for all information processed by this Software.</p>
                    </Section>

                    <Section title="2. Data Collected by the Agent">
                        <p>The SysTracker Agent, installed on monitored machines, collects the following categories of data and transmits them to your self-hosted SysTracker Server:</p>
                        <ul>
                            <li><strong>System Metrics:</strong> CPU usage, RAM usage, disk space, network upload/download speeds.</li>
                            <li><strong>Hardware Information:</strong> CPU model, RAM modules, GPU details, motherboard manufacturer/model/serial, disk models and serials, network adapter details.</li>
                            <li><strong>Operating System Information:</strong> OS name, version, codename, serial number, UEFI status, machine UUID.</li>
                            <li><strong>Process Information:</strong> Top running processes (name, PID, CPU%, RAM usage). No process arguments or file contents are captured.</li>
                            <li><strong>Windows Event Logs:</strong> Selected security and system event IDs (e.g., login events, service failures). Raw log message content may be included.</li>
                            <li><strong>Network Identity:</strong> Local IP address, MAC address, hostname.</li>
                            <li><strong>Logged-in Users:</strong> Usernames of currently active Windows sessions.</li>
                            <li><strong>Profile Information:</strong> Optionally assigned user name, role, floor, desk, and asset ID — entered manually by an administrator.</li>
                        </ul>
                    </Section>

                    <Section title="3. Data Storage">
                        <p>All collected data is stored in a <strong>SQLite database on your own server</strong> (the machine running the SysTracker Server). No data is transmitted to any third-party service, cloud provider, or the SysTracker project maintainers.</p>
                        <p>You are solely responsible for securing the server, the database file, and access to the dashboard.</p>
                    </Section>

                    <Section title="4. Data Retention">
                        <p>SysTracker does not automatically purge data. Telemetry metrics, events, and logs accumulate in the database until manually deleted or until you implement your own retention policy. See our <Link href="/data-retention" className="text-blue-600 hover:underline">Data Retention Policy</Link> for recommended practices.</p>
                    </Section>

                    <Section title="5. Access Control">
                        <p>The SysTracker dashboard includes built-in JWT authentication for admin access. <strong>It is your responsibility</strong> to further restrict access using network-level controls (firewall rules, VPN, reverse proxy) as appropriate for your environment.</p>
                    </Section>

                    <Section title="6. Third-Party Services">
                        <p>The SysTracker dashboard uses the following third-party resources:</p>
                        <ul>
                            <li><strong>DiceBear Avatars API</strong> (<code>api.dicebear.com</code>): Used optionally when an administrator randomizes a profile avatar. A request is made to DiceBear&apos;s public API with a random seed. No personal data is sent.</li>
                            <li><strong>Google Fonts / Next.js CDN:</strong> The dashboard may load fonts from Google&apos;s CDN. Standard Google Fonts privacy terms apply.</li>
                        </ul>
                        <p>No analytics, tracking pixels, or advertising SDKs are included.</p>
                    </Section>

                    <Section title="7. Employee &amp; End-User Data">
                        <p>If you use SysTracker to monitor machines used by employees or other individuals, you are responsible for:</p>
                        <ul>
                            <li>Informing monitored users about the data being collected.</li>
                            <li>Complying with applicable employment laws, labor regulations, and privacy laws (e.g., GDPR, CCPA, PDPA) in your jurisdiction.</li>
                            <li>Obtaining any necessary consent before deploying monitoring agents.</li>
                        </ul>
                    </Section>

                    <Section title="8. Security Recommendations">
                        <ul>
                            <li>Deploy the server behind a VPN or reverse proxy with authentication.</li>
                            <li>Use HTTPS/TLS for all communications between agents and the server.</li>
                            <li>Restrict database file permissions to the server process user only.</li>
                            <li>Regularly back up the database file.</li>
                            <li>Keep the SysTracker Server and Agent updated to the latest version.</li>
                        </ul>
                    </Section>

                    <Section title="9. Changes to This Policy">
                        <p>This policy may be updated as new features are added to SysTracker. The &quot;Last updated&quot; date at the top of this page will reflect any changes.</p>
                    </Section>

                    <Section title="10. Contact">
                        <p>SysTracker is a self-hosted monitoring project. For questions or concerns, contact us at <a href="mailto:SysTracker@rico.bd" className="text-blue-600 hover:underline">SysTracker@rico.bd</a> or open an issue on the <a href="https://github.com/Redwan002117/SysTracker" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub repository</a>.</p>
                    </Section>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">{title}</h2>
            <div className="text-slate-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-slate-800 [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono">
                {children}
            </div>
        </section>
    );
}


