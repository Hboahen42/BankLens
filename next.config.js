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
    allowedDevOrigins: ['192.168.0.143']
};

export default nextConfig;