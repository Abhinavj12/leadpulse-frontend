/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://leadpulse-alb-1718263315.ap-south-1.elb.amazonaws.com/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;