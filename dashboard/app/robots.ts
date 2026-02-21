import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// Dashboard is a private admin panel — disallow all search engine crawling
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                disallow: '/',
            },
        ],
    };
}
