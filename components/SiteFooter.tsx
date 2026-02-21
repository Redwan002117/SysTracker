'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

/**
 * RedwanCodes brand logo with hover swap:
 *  - Default: 2.svg (coloured mark)
 *  - Hover:   1.svg (alternate mark, cross-fades in)
 */
function RedwanCodesLogo() {
    return (
        <a
            href="https://redwancodes.com"
            target="_blank"
            rel="noopener noreferrer"
            title="RedwanCodes"
            className="group relative flex items-center gap-2.5 select-none"
        >
            {/* Logo image with hover swap */}
            <span className="relative w-14 h-14 flex-shrink-0">
                {/* Default: 2.svg */}
                <img
                    src="https://redwancodes.com/wp-content/uploads/2025/08/2.svg"
                    alt="RedwanCodes"
                    className="absolute inset-0 w-full h-full object-contain
                               transition-opacity duration-300 ease-in-out
                               opacity-100 group-hover:opacity-0"
                    draggable={false}
                />
                {/* Hover: 1.svg */}
                <img
                    src="https://redwancodes.com/wp-content/uploads/2025/08/1.svg"
                    alt="RedwanCodes"
                    className="absolute inset-0 w-full h-full object-contain
                               transition-opacity duration-300 ease-in-out
                               opacity-0 group-hover:opacity-100"
                    draggable={false}
                />
            </span>
            <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">
                RedwanCodes
            </span>
        </a>
    );
}

interface SiteFooterProps {
    /** Extra top margin variant — use 'mt-20' on pages without a natural end section */
    extraTopMargin?: boolean;
    /** Whether to include the Contact link in the nav */
    showContact?: boolean;
}

export default function SiteFooter({ extraTopMargin = false, showContact = false }: SiteFooterProps) {
    return (
        <footer className={`border-t border-slate-200 bg-white${extraTopMargin ? ' mt-20' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Left — SysTracker brand */}
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-1 rounded-md">
                            <Zap size={16} fill="currentColor" />
                        </div>
                        <span className="font-bold text-slate-900">SysTracker</span>
                    </div>

                    {/* Centre — nav links */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                        {showContact && (
                            <Link href="/contact"   className="hover:text-blue-600 transition-colors">Contact</Link>
                        )}
                        <Link href="/privacy"       className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <Link href="/terms"         className="hover:text-blue-600 transition-colors">Terms of Use</Link>
                        <Link href="/data-retention" className="hover:text-blue-600 transition-colors">Data Retention</Link>
                        <Link href="/acceptable-use" className="hover:text-blue-600 transition-colors">Acceptable Use</Link>
                    </div>

                    {/* Right — copyright + RedwanCodes logo */}
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <p className="text-slate-400 text-sm">
                            © {new Date().getFullYear()} SysTracker. Proprietary License.
                        </p>
                        <RedwanCodesLogo />
                    </div>

                </div>
            </div>
        </footer>
    );
}
