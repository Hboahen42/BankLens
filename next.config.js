/** @type {import('next').NextConfig} */
import {withAxiom} from 'next-axiom';

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    }
};


export default withAxiom(nextConfig);