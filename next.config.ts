import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: [
        "permissionless",
        "viem",
        "@privy-io/react-auth",
        "@privy-io/wagmi",
    ],
    allowedDevOrigins: [
        "192.168.1.79",
        "vanita-unbeseeming-connaturally.ngrok-free.dev",
    ],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "sensitive-mockingbird-6dww5.lighthouseweb3.xyz",
            },
        ],
    },
    turbopack: {},
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
};

export default nextConfig;
