import type { MetadataRoute } from 'next';

const BASE_URL = 'https://systracker.rico.bd';

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date('2026-02-21');
    return [
        {
            url: BASE_URL,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/download`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/data-retention`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/acceptable-use`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];
}
