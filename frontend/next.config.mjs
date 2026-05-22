import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
        {
            source: '/uploads/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/uploads/:path*`
        }
    ]
  }
};



export default nextConfig;