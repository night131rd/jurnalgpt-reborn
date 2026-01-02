import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://jurnalgpt.app';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/profile',
                    '/auth/',
                    '/payment/',
                    '/upgrade',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
