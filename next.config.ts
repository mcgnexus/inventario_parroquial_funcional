import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de imágenes
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

  // Headers personalizados
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

  // Configuración para resolver el warning de múltiples lockfiles
  // Especifica la raíz del proyecto para el output file tracing
  outputFileTracingRoot: undefined, // Next.js usará el directorio actual como raíz
};

export default nextConfig;
