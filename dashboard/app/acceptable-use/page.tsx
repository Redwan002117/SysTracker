'use client';

import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { AlertTriangle, Zap } from 'lucide-react';

export default function AcceptableUsePolicy() {
    const lastUpdated = 'February 18, 2026';

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />
            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-50 rounded-xl">
                            <AlertTriangle className="text-amber-600" size={28} />
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Acceptable Use Policy</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                        SysTracker is a powerful monitoring tool. Misuse can violate privacy laws and individual rights. Please read this policy carefully before deploying.
                    </div>
                </div>

                <div className="prose prose-slate max-w-none space-y-10">

                    <Section title="1. Purpose">
                        <p>This Acceptable Use Policy ("AUP") defines the boundaries of acceptable use for SysTracker. It applies to all administrators, operators, and organizations that deploy the Software. The goal is to ensure SysTracker is used ethically, legally, and responsibly.</p>
                    </Section>

                    <Section title="2. Authorized Use">
                        <p>SysTracker is designed for the following legitimate use cases:</p>
                        <ul>
                            <li>IT administrators monitoring company-owned devices on corporate networks.</li>
                            <li>System administrators managing server fleets and infrastructure.</li>
                            <li>Managed Service Providers (MSPs) monitoring client infrastructure with explicit client authorization.</li>
                            <li>Developers and home lab users monitoring their own personal equipment.</li>
                            <li>Educational institutions monitoring lab computers with appropriate disclosure to users.</li>
                        </ul>
                    </Section>

                    <Section title="3. Prohibited Activities">
                        <p>The following uses of SysTracker are strictly prohibited:</p>
                        <ul>
                            <li><strong>Unauthorized Monitoring:</strong> Installing agents on machines you do not own or do not have explicit written authorization to monitor.</li>
                            <li><strong>Covert Surveillance:</strong> Monitoring individuals without their knowledge where disclosure is required by law or ethical standards.</li>
                            <li><strong>Personal Device Monitoring:</strong> Installing agents on employees' personal devices (BYOD) without explicit, informed consent.</li>
                            <li><strong>Data Harvesting:</strong> Collecting telemetry data for purposes beyond operational monitoring (e.g., selling data, profiling individuals for non-operational purposes).</li>
                            <li><strong>Harassment or Stalking:</strong> Using monitoring data to harass, intimidate, or stalk individuals.</li>
                            <li><strong>Illegal Activity:</strong> Using the Software in any way that violates applicable local, national, or international laws.</li>
                            <li><strong>Security Circumvention:</strong> Using the agent or server to gain unauthorized access to systems, networks, or data.</li>
                            <li><strong>Discrimination:</strong> Using monitoring data to discriminate against individuals based on protected characteristics.</li>
                        </ul>
                    </Section>

                    <Section title="4. Employee Monitoring Guidelines">
                        <p>If deploying SysTracker to monitor employee workstations, you must:</p>
                        <ul>
                            <li>Have a written, documented monitoring policy reviewed by legal counsel.</li>
                            <li>Inform employees in writing about the nature, scope, and purpose of monitoring before deployment.</li>
                            <li>Obtain any consent required by applicable employment or privacy laws.</li>
                            <li>Limit data collection to what is strictly necessary for the stated business purpose.</li>
                            <li>Restrict access to monitoring data to authorized personnel only.</li>
                            <li>Not use monitoring data for purposes beyond those disclosed to employees.</li>
                        </ul>
                    </Section>

                    <Section title="5. Network & Security Requirements">
                        <p>To use SysTracker responsibly, administrators must:</p>
                        <ul>
                            <li>Restrict dashboard access to authorized personnel only (firewall, VPN, authentication proxy).</li>
                            <li>Use encrypted communications (HTTPS/TLS) between agents and the server.</li>
                            <li>Not expose the SysTracker API or dashboard to the public internet without authentication.</li>
                            <li>Regularly audit who has access to the dashboard and revoke access for departed personnel.</li>
                            <li>Keep the Software updated to receive security patches.</li>
                        </ul>
                    </Section>

                    <Section title="6. Consequences of Misuse">
                        <p>Misuse of SysTracker may result in:</p>
                        <ul>
                            <li>Civil liability under privacy laws (GDPR fines, CCPA penalties, etc.).</li>
                            <li>Criminal prosecution under computer fraud and abuse laws.</li>
                            <li>Employment law violations and labor disputes.</li>
                            <li>Reputational damage to your organization.</li>
                        </ul>
                        <p>The SysTracker project maintainers are not liable for any misuse of the Software. You assume full legal responsibility for your deployment.</p>
                    </Section>

                    <Section title="7. Reporting Misuse">
                        <p>If you believe SysTracker is being misused or if you have discovered a security vulnerability, please report it via the <a href="https://github.com/Redwan002117/SysTracker/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Issues page</a>.</p>
                    </Section>

                    <Section title="8. Policy Updates">
                        <p>This AUP may be updated to reflect new features, legal requirements, or community feedback. The "Last updated" date reflects the most recent revision.</p>
                    </Section>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">{title}</h2>
            <div className="text-slate-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-slate-800">
                {children}
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-1 rounded-md">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <span className="font-bold text-slate-900">SysTracker</span>
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                    <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Use</Link>
                    <Link href="/data-retention" className="hover:text-blue-600 transition-colors">Data Retention</Link>
                    <Link href="/acceptable-use" className="hover:text-blue-600 transition-colors">Acceptable Use</Link>
                </div>
                <p className="text-slate-400 text-sm">© {new Date().getFullYear()} SysTracker. Open Source.</p>
            </div>
        </footer>
    );
}
