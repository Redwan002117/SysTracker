import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [],
            },
        ],
        sitemap: 'https://systracker.rico.bd/sitemap.xml',
        host: 'https://systracker.rico.bd',
    };
}
