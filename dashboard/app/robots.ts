import type { MetadataRoute } from 'next';

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
