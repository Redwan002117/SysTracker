'use client';

import Link from 'next/link';
import PortfolioNavbar from '../../components/PortfolioNavbar';
import { FileText } from 'lucide-react';
import SiteFooter from '../../components/SiteFooter';

export default function TermsOfUse() {
    const lastUpdated = 'February 18, 2026';

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <PortfolioNavbar />
            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <FileText className="text-blue-600" size={28} />
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Terms of Use</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm">
                        SysTracker is open-source software licensed under the MIT License. By deploying or using this Software, you agree to these terms.
                    </div>
                </div>

                <div className="prose prose-slate max-w-none space-y-10">
                    <Section title="1. Acceptance of Terms">
                        <p>By installing, deploying, or using SysTracker (the &quot;Software&quot;), you agree to be bound by these Terms of Use. If you do not agree, do not use the Software.</p>
                    </Section>

                    <Section title="2. License">
                        <p>SysTracker is released under the <strong>MIT License</strong>. You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the conditions of the MIT License included with the source code.</p>
                        <p>The MIT License is provided &quot;as is,&quot; without warranty of any kind, express or implied.</p>
                    </Section>

                    <Section title="3. Permitted Use">
                        <p>You may use SysTracker to:</p>
                        <ul>
                            <li>Monitor machines and infrastructure that you own or have explicit authorization to monitor.</li>
                            <li>Collect and store telemetry data on your own self-hosted infrastructure.</li>
                            <li>Modify and redistribute the Software in accordance with the MIT License.</li>
                            <li>Deploy the Software in commercial, enterprise, or personal environments.</li>
                        </ul>
                    </Section>

                    <Section title="4. Prohibited Use">
                        <p>You must <strong>not</strong> use SysTracker to:</p>
                        <ul>
                            <li>Monitor machines, networks, or systems without the explicit knowledge and consent of the owner or authorized administrator.</li>
                            <li>Collect, store, or transmit data in violation of applicable laws, including privacy laws (GDPR, CCPA, PDPA, etc.) and computer fraud laws.</li>
                            <li>Deploy agents on machines belonging to individuals without their informed consent, where required by law.</li>
                            <li>Use the Software for surveillance, stalking, or any activity that violates the rights of individuals.</li>
                            <li>Circumvent security controls or use the Software to gain unauthorized access to systems.</li>
                        </ul>
                    </Section>

                    <Section title="5. Administrator Responsibilities">
                        <p>As the administrator deploying SysTracker, you are solely responsible for:</p>
                        <ul>
                            <li>Securing the SysTracker Server and dashboard from unauthorized access.</li>
                            <li>Complying with all applicable laws and regulations in your jurisdiction regarding employee monitoring and data privacy.</li>
                            <li>Informing monitored users about the nature and scope of data collection.</li>
                            <li>Implementing appropriate data retention and deletion policies.</li>
                            <li>Maintaining the security of the server infrastructure, database, and network communications.</li>
                        </ul>
                    </Section>

                    <Section title="6. No Warranty">
                        <p>The Software is provided &quot;as is,&quot; without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. The authors and contributors of SysTracker shall not be liable for any claim, damages, or other liability arising from the use of the Software.</p>
                    </Section>

                    <Section title="7. Limitation of Liability">
                        <p>In no event shall the SysTracker project maintainers or contributors be liable for any direct, indirect, incidental, special, exemplary, or consequential damages arising out of the use or inability to use the Software.</p>
                    </Section>

                    <Section title="8. Indemnification">
                        <p>You agree to indemnify, defend, and hold harmless the SysTracker project maintainers and contributors from any claims, liabilities, damages, losses, and expenses arising from your use of the Software, your violation of these Terms, or your violation of any applicable law or third-party rights.</p>
                    </Section>

                    <Section title="9. Modifications to Terms">
                        <p>These Terms may be updated from time to time. The &quot;Last updated&quot; date reflects the most recent revision. Continued use of the Software after changes constitutes acceptance of the updated Terms.</p>
                    </Section>

                    <Section title="10. Governing Law">
                        <p>These Terms shall be governed by and construed in accordance with the laws applicable in the jurisdiction where the Software is deployed. The SysTracker project does not impose any specific governing jurisdiction, as it is a self-hosted, open-source tool.</p>
                    </Section>

                    <Section title="11. Contact">
                        <p>For questions about these Terms, contact us at <a href="mailto:SysTracker@rico.bd" className="text-blue-600 hover:underline">SysTracker@rico.bd</a> or open an issue on the <a href="https://github.com/Redwan002117/SysTracker" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub repository</a>.</p>
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
            <div className="text-slate-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-slate-800">
                {children}
            </div>
        </section>
    );
}


