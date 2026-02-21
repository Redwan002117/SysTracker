'use client';

import Link from 'next/link';
import PortfolioNavbar from '../../components/PortfolioNavbar';
import { AlertTriangle } from 'lucide-react';
import SiteFooter from '../../components/SiteFooter';

export default function AcceptableUsePolicy() {
    const lastUpdated = 'February 18, 2026';
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <PortfolioNavbar />
            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-50 rounded-xl"><AlertTriangle className="text-amber-600" size={28} /></div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Acceptable Use Policy</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                        SysTracker is a powerful monitoring tool. Misuse can violate privacy laws and individual rights. Please read this policy carefully before deploying.
                    </div>
                </div>
                <div className="prose prose-slate max-w-none space-y-10">
                    <Section title="1. Purpose">
                        <p>This Acceptable Use Policy (&quot;AUP&quot;) defines the boundaries of acceptable use for SysTracker. It applies to all administrators, operators, and organizations that deploy the Software.</p>
                    </Section>
                    <Section title="2. Authorized Use">
                        <ul>
                            <li>IT administrators monitoring company-owned devices on corporate networks.</li>
                            <li>System administrators managing server fleets and infrastructure.</li>
                            <li>MSPs monitoring client infrastructure with explicit client authorization.</li>
                            <li>Developers and home lab users monitoring their own personal equipment.</li>
                            <li>Educational institutions monitoring lab computers with appropriate disclosure.</li>
                        </ul>
                    </Section>
                    <Section title="3. Prohibited Activities">
                        <ul>
                            <li><strong>Unauthorized Monitoring:</strong> Installing agents on machines without explicit written authorization.</li>
                            <li><strong>Covert Surveillance:</strong> Monitoring individuals without their knowledge where disclosure is required by law.</li>
                            <li><strong>Personal Device Monitoring:</strong> Installing agents on employees&apos; personal devices without informed consent.</li>
                            <li><strong>Data Harvesting:</strong> Collecting telemetry data for purposes beyond operational monitoring.</li>
                            <li><strong>Harassment or Stalking:</strong> Using monitoring data to harass or stalk individuals.</li>
                            <li><strong>Illegal Activity:</strong> Using the Software in any way that violates applicable laws.</li>
                            <li><strong>Security Circumvention:</strong> Using the agent or server to gain unauthorized access to systems.</li>
                            <li><strong>Discrimination:</strong> Using monitoring data to discriminate against individuals.</li>
                        </ul>
                    </Section>
                    <Section title="4. Employee Monitoring Guidelines">
                        <ul>
                            <li>Have a written, documented monitoring policy reviewed by legal counsel.</li>
                            <li>Inform employees in writing about the nature, scope, and purpose of monitoring.</li>
                            <li>Obtain any consent required by applicable employment or privacy laws.</li>
                            <li>Limit data collection to what is strictly necessary for the stated business purpose.</li>
                            <li>Restrict access to monitoring data to authorized personnel only.</li>
                        </ul>
                    </Section>
                    <Section title="5. Network &amp; Security Requirements">
                        <ul>
                            <li>Restrict dashboard access to authorized personnel only (firewall, VPN, auth proxy).</li>
                            <li>Use encrypted communications (HTTPS/TLS) between agents and the server.</li>
                            <li>Do not expose the SysTracker API or dashboard to the public internet without authentication.</li>
                            <li>Regularly audit who has access to the dashboard and revoke access for departed personnel.</li>
                            <li>Keep the Software updated to receive security patches.</li>
                        </ul>
                    </Section>
                    <Section title="6. Consequences of Misuse">
                        <ul>
                            <li>Civil liability under privacy laws (GDPR fines, CCPA penalties, etc.).</li>
                            <li>Criminal prosecution under computer fraud and abuse laws.</li>
                            <li>Employment law violations and labor disputes.</li>
                            <li>Reputational damage to your organization.</li>
                        </ul>
                        <p>The SysTracker project maintainers are not liable for any misuse. You assume full legal responsibility for your deployment.</p>
                    </Section>
                    <Section title="7. Reporting Misuse">
                        <p>Report misuse or security vulnerabilities by emailing <a href="mailto:SysTracker@rico.bd" className="text-blue-600 hover:underline">SysTracker@rico.bd</a> or via the <a href="https://github.com/Redwan002117/SysTracker/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Issues page</a>.</p>
                    </Section>
                    <Section title="8. Policy Updates">
                        <p>This AUP may be updated to reflect new features, legal requirements, or community feedback.</p>
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
            <div className="text-slate-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-slate-800">{children}</div>
        </section>
    );
}
