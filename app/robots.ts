import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/database-viewer/',
        '/(authenticated)/',
      ],
    },
    sitemap: 'https://ninowash.fr/sitemap.xml',
  }
}
