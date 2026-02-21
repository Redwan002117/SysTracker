'use client';

import Link from 'next/link';
import PortfolioNavbar from '../../components/PortfolioNavbar';
import { Database } from 'lucide-react';
import SiteFooter from '../../components/SiteFooter';

export default function DataRetentionPolicy() {
    const lastUpdated = 'February 18, 2026';

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <PortfolioNavbar />
            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <Database className="text-blue-600" size={28} />
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Data Retention Policy</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
                        <strong>Administrator Action Required:</strong> SysTracker does not automatically delete data. You must implement your own retention schedule to avoid unbounded database growth and to comply with applicable regulations.
                    </div>
                </div>

                <div className="prose prose-slate max-w-none space-y-10">
                    <Section title="1. What Data Is Retained">
                        <p>SysTracker stores the following categories of data in its SQLite database:</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Table</th>
                                    <th>Data Type</th>
                                    <th>Growth Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><code>machines</code></td>
                                    <td>Machine identity, hardware info, profile, last seen</td>
                                    <td>One row per machine (low)</td>
                                </tr>
                                <tr>
                                    <td><code>metrics</code></td>
                                    <td>CPU, RAM, disk, network, processes — per update cycle</td>
                                    <td>High — grows every agent interval</td>
                                </tr>
                                <tr>
                                    <td><code>events</code></td>
                                    <td>Windows Event Log entries</td>
                                    <td>Medium — depends on event frequency</td>
                                </tr>
                                <tr>
                                    <td><code>logs</code></td>
                                    <td>Agent/server error logs</td>
                                    <td>Low to medium</td>
                                </tr>
                            </tbody>
                        </table>
                    </Section>

                    <Section title="2. Recommended Retention Periods">
                        <ul>
                            <li><strong>Metrics data:</strong> 30–90 days for operational monitoring.</li>
                            <li><strong>Event logs:</strong> 90–180 days for security auditing.</li>
                            <li><strong>System logs:</strong> 30 days for debugging purposes.</li>
                            <li><strong>Machine records:</strong> Retain as long as the machine is active.</li>
                        </ul>
                    </Section>

                    <Section title="3. How to Delete Old Data">
                        <p>Connect to the SQLite database and run the following SQL commands to purge old records:</p>
                        <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto font-mono">
                            {`-- Delete metrics older than 90 days
DELETE FROM metrics
WHERE timestamp < datetime('now', '-90 days');

-- Delete events older than 180 days
DELETE FROM events
WHERE timestamp < datetime('now', '-180 days');

-- Delete logs older than 30 days
DELETE FROM logs
WHERE timestamp < datetime('now', '-30 days');

-- Reclaim disk space after deletion
VACUUM;`}
                        </pre>
                        <p>Run these commands using the SQLite CLI:</p>
                        <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto font-mono">
                            {`sqlite3 /path/to/systracker.db < cleanup.sql`}
                        </pre>
                    </Section>

                    <Section title="4. Automating Retention (Recommended)">
                        <p>Set up a scheduled task or cron job to run cleanup queries automatically:</p>
                        <p><strong>Linux (cron):</strong></p>
                        <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto font-mono">
                            {`# Run every Sunday at 2:00 AM
0 2 * * 0 sqlite3 /DATA/AppData/Monitor/systracker.db "DELETE FROM metrics WHERE timestamp < datetime('now', '-90 days'); VACUUM;"`}
                        </pre>
                        <p><strong>Windows (Task Scheduler):</strong> Create a scheduled task that runs a PowerShell script executing the above SQLite commands weekly.</p>
                    </Section>

                    <Section title="5. Compliance Considerations">
                        <ul>
                            <li><strong>GDPR (EU):</strong> Data must not be kept longer than necessary for its purpose.</li>
                            <li><strong>HIPAA (US Healthcare):</strong> Security event logs may need to be retained for 6 years.</li>
                            <li><strong>SOC 2:</strong> Typically requires 1 year of log retention for audit evidence.</li>
                            <li><strong>ISO 27001:</strong> Requires a documented information retention policy.</li>
                            <li><strong>Local labor laws:</strong> Employee monitoring data may have specific retention limits.</li>
                        </ul>
                    </Section>

                    <Section title="6. Data Deletion Requests">
                        <p>If a monitored user requests deletion of their data, the administrator is responsible for identifying and deleting all records associated with that user&apos;s machine(s):</p>
                        <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto font-mono">
                            {`-- Replace 'MACHINE_ID' with the actual machine ID
DELETE FROM metrics WHERE machine_id = 'MACHINE_ID';
DELETE FROM events WHERE machine_id = 'MACHINE_ID';
DELETE FROM logs WHERE machine_id = 'MACHINE_ID';
DELETE FROM machines WHERE id = 'MACHINE_ID';
VACUUM;`}
                        </pre>
                    </Section>

                    <Section title="7. Backup Policy">
                        <p>Before running any deletion operations, ensure you have a current backup of the database file. Store backups in a secure, access-controlled location and apply the same retention policy to backup copies.</p>
                    </Section>

                    <Section title="8. Contact">
                        <p>For questions about data retention, contact us at <a href="mailto:SysTracker@rico.bd" className="text-blue-600 hover:underline">SysTracker@rico.bd</a> or open an issue on the <a href="https://github.com/Redwan002117/SysTracker" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub repository</a>.</p>
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
            <div className="text-slate-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-slate-800 [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:bg-slate-100 [&_th]:text-slate-700 [&_th]:text-sm [&_th]:font-semibold [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-slate-200 [&_td]:text-sm">
                {children}
            </div>
        </section>
    );
}
