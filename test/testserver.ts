import { Agent, createServer } from 'https';
import { connectDB, logger, populateDB, nodeConfig } from '../src/shared';
import type { AddressInfo } from 'net';
import type { RequestListener } from 'http';
import type { SecureContextOptions } from 'tls';
import type { Server } from 'http';
import { app } from '../src/app';

// -----------------------------------------------------------------------------
// T e s t s e r v e r   m i t   H T T P S   u n d   R a n d o m   P o r t
// -----------------------------------------------------------------------------
let server: Server;

export const createTestserver = async () => {
    await populateDB();
    await connectDB();

    const { cert, key } = nodeConfig;
    // Shorthand Properties
    const options: SecureContextOptions = { key, cert, minVersion: 'TLSv1.3' };
    server = createServer(options, app as RequestListener)
        // random port
        .listen(() => {
            logger.info(`Node ${process.version}`);
            const address = server.address() as AddressInfo;
            if (address !== null && typeof address !== 'string') {
                const { host } = nodeConfig;
                logger.info(
                    `Testserver ist gestartet: https://${host}:${address.port}`,
                );
            }
            server.emit('testServerStarted');
        });
    return server;
};

// fuer selbst-signierte Zertifikate
export const agent = new Agent({ rejectUnauthorized: false });

export enum HttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    PATCH = 'patch',
    DELETE = 'delete',
}
