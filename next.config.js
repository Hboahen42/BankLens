/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
    serverExternalPackages: ['pino', 'pino-pretty', '@logtail/pino'],
};

module.exports = nextConfig;