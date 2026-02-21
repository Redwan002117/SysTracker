import { NextResponse } from 'next/server';

/**
 * GET /install
 *
 * Serves the SysTracker PowerShell install helper from the official website.
 * Redirects to the latest GitHub release asset so:
 *
 *   irm https://systracker.rico.bd/install | iex
 *
 * …works without exposing raw GitHub URLs to end-users.
 */
export async function GET() {
    return NextResponse.redirect(
        'https://github.com/Redwan002117/SysTracker/releases/latest/download/Install-SysTracker.ps1',
        { status: 302 }
    );
}
