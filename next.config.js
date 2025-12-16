/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable rewrites to serve documentation from /docs
  async rewrites() {
    return [
      {
        source: '/docs/html',
        destination: '/docs/html/index.html',
      },
      {
        source: '/docs/html/',
        destination: '/docs/html/index.html',
      },
      {
        source: '/docs/latex',
        destination: '/docs/latex/index.html',
      },
      {
        source: '/docs/latex/',
        destination: '/docs/latex/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
