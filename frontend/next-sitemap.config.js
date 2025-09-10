/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://onetime-frontend.vercel.app',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/api/*',
    '/admin/*',
    '/auth/*',
    '/server-sitemap.xml',
  ],
  generateIndexSitemap: false,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/_next/',
        ],
      },
    ],
    additionalSitemaps: [
      'https://onetime-frontend.vercel.app/server-sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // Set custom priority for important pages
    if (path === '/') {
      return {
        loc: path,
        changefreq: config.changefreq,
        priority: 1.0,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    
    if (path === '/jobs' || path === '/about' || path === '/contact') {
      return {
        loc: path,
        changefreq: config.changefreq,
        priority: 0.8,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    
    // Default transformation
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};