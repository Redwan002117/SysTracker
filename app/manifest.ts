import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SysTracker — Windows Fleet Monitoring',
        short_name: 'SysTracker',
        description:
            'Self-hosted Remote Monitoring & Management tool for Windows fleets. Real-time CPU, RAM, disk, and network telemetry.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#2563eb',
        orientation: 'portrait-primary',
        categories: ['utilities', 'productivity', 'business'],
        icons: [
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/logo.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
            {
                src: '/favicon.ico',
                sizes: '48x48',
                type: 'image/x-icon',
            },
        ],
        screenshots: [
            {
                src: '/banner.svg',
                sizes: '1200x630',
                type: 'image/svg+xml',
            },
        ],
    };
}
