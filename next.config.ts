import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'evwzkyexysderscrwawc.supabase.co',
        pathname: '/**',
      },
    ],
  },
  // Exclude canvaskit-wasm from server-side bundling
  serverExternalPackages: ['canvaskit-wasm'],
  // Turbopack config - resolve Node.js modules for browser
  turbopack: {
    resolveAlias: {
      // Polyfill Node.js modules for browser (canvaskit-wasm needs these)
      fs: { browser: './src/lib/polyfills/empty.js' },
      path: { browser: './src/lib/polyfills/empty.js' },
    },
  },
};

export default nextConfig;
