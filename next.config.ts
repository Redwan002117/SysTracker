import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'export',          // Static HTML export — deploy anywhere
    images: {
        unoptimized: true,       // Required for static export
    },
    // Base path if hosting in a subdirectory (e.g. GitHub Pages /SysTracker/)
    // basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

export default nextConfig;
