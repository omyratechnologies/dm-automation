/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for Docker deployments (apps/web/Dockerfile)
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "scontent-phx1-1.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
    ],
  },
  
  // Bundle optimization
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "lucide-react",
      "recharts",
    ],
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  
  // Code splitting optimization
  webpack: (config, { isServer }) => {
    // Suppress webpack cache warnings about large strings
    config.infrastructureLogging = {
      level: "error",
    };
    
    // Optimize chunk splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Radix UI components in separate chunk
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: "radix-ui",
              priority: 30,
              reuseExistingChunk: true,
            },
            // Charts library
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: "recharts",
              priority: 25,
              reuseExistingChunk: true,
            },
            // OpenAI
            openai: {
              test: /[\\/]node_modules[\\/]openai[\\/]/,
              name: "openai",
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendor",
              priority: 10,
              reuseExistingChunk: true,
              minChunks: 2,
            },
            // Common components used across pages
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Compression
  compress: true,
  
  // Power optimization
  poweredByHeader: false,
};

export default nextConfig;
