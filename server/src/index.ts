import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
    const baseUrl = `http://localhost:${env.PORT}`;
    console.log(`API listening on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Health: ${baseUrl}/api/${env.API_VERSION}/health`);
});

const shutdown = (signal: NodeJS.Signals) => {
    console.log(`${signal} received, shutting down`);

    server.close((err) => {
        process.exit(err ? 1 : 0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (err) => {
    console.error(err);
    shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
    console.error(reason);
    shutdown('SIGTERM');
});
