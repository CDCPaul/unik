import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/profile', '/apply/thanks'] },
    sitemap: 'https://unik.ph/sitemap.xml',
  };
}
