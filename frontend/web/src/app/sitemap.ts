import type { MetadataRoute } from 'next';

const PATHS = ['', '/seoul-marathon', '/tour', '/artjoy', '/faq', '/apply', '/past-tours', '/contact', '/terms', '/privacy', '/refund-policy'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `https://unik.ph${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 }));
}
