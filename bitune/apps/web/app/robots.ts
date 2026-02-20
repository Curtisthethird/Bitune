import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bittune.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',      // Don't crawl API routes
                '/library',   // User specific library
                '/wallet',    // User specific wallet
                '/profile',   // Logged in profile settings
                '/artist/dashboard', // Private dashboards
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
