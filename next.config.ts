import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Le foto vengono già compresse lato client, ma alziamo comunque il limite
      // predefinito (1MB) fino al tetto massimo consentito dalle funzioni serverless di Vercel.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
