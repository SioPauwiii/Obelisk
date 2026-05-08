import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    API_VERSION: z.string().default("v1"),
    PRIVY_APP_ID: z.string().min(1, "PRIVY_APP_ID is required"),
    PRIVY_APP_SECRET: z.string().min(1, "PRIVY_APP_SECRET is required"),
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGIN: z.string().default("*"),
    RATE_LIMIT_WINDOW_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(
        "Invalid environment configuration:",
        parsed.error.flatten().fieldErrors,
    );
    process.exit(1);
}

export const env = parsed.data;
