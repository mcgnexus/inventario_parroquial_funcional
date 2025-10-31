import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wcmzsaihdpfpfdzhruqt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    qualities: [25, 50, 75, 80, 90, 100],
  },
  async headers() {
    return [
      {
        source: "/guadix.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ]
  },
};

export default nextConfig;
