import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "gateway.lighthouse.storage",
            },
        ],
    },
};

export default nextConfig;
