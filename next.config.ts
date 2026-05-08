import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "sensitive-mockingbird-6dww5.lighthouseweb3.xyz",
            },
        ],
    },
};

export default nextConfig;
