import compression from 'compression';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { rateLimit } from 'express-rate-limit';
import zlib from 'zlib';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundTemplate } from './templates/backend.template';
import healthRouter from './routes/health';

const rawOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowAllOrigins = rawOrigins.includes('*');

const corsOptions: cors.CorsOptions = allowAllOrigins
    ? { origin: true, credentials: false }
    : { origin: rawOrigins, credentials: true };

export const app = express();

const shouldCompress = (req: Request, res: Response) => {
    const contentType = res.getHeader('Content-Type');
    if (contentType) {
        const type = contentType.toString().toLowerCase();
        if (
            type.startsWith('image/') ||
            type.startsWith('audio/') ||
            type.startsWith('video/') ||
            type.includes('application/pdf') ||
            type.includes('application/zip') ||
            type.includes('application/x-zip-compressed') ||
            type.includes('application/gzip') ||
            type.includes('application/x-gzip') ||
            type.includes('application/x-7z-compressed') ||
            type.includes('application/x-rar-compressed')
        ) {
            return false;
        }
    }
    if (res.getHeader('Content-Encoding')) {
        return false;
    }
    return compression.filter(req, res);
};

app.set('trust proxy', env.TRUST_PROXY);

app.use(
    pinoHttp({
        transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
    })
);

app.use(helmet());
app.use(hpp());
app.use(cors(corsOptions));
app.use(
    rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
    })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(
    compression({
        threshold: 1024,
        filter: shouldCompress,
        brotli: {
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
            },
        },
    })
);

app.use(`/api/${env.API_VERSION}/health`, healthRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
    // 1. Browser Request? -> Return 404 Page
    if (req.accepts('html')) {
        res.status(404).setHeader('Content-Type', 'text/html');
        return res.send(notFoundTemplate(req.originalUrl));
    }

    // 2. API Request? -> Return JSON Error
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
    });
});

app.use(errorHandler);
export default app;
