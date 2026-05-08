import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

type ErrorWithStatus = Error & { status?: number; statusCode?: number };

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'ValidationError',
            details: err.flatten(),
        });
    }

    const error = err as ErrorWithStatus;
    const status =
        typeof error.status === 'number'
            ? error.status
            : typeof error.statusCode === 'number'
              ? error.statusCode
              : 500;

    if (status === 500 && env.NODE_ENV !== 'production') {
        console.error(err);
    }

    const message = status === 500 ? 'InternalServerError' : error.message || 'Error';

    return res.status(status).json({ error: message });
}
