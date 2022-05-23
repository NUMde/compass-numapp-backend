/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';
import { ConnectionOptions } from 'tls';

import logger from 'jet-logger';

import { DBCredentials } from '../config/DBCredentials';

/**
 * Database driver related logic.
 * The class includes Postgres specific code.
 *
 * @class DB
 */
export class DB {
    // Singleton
    private static poolInstance: Pool;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     * Get the db pool instance to query the database.
     *
     * @static
     * @return {*}  {Pool}
     * @memberof DB
     */
    public static getPool(): Pool {
        return DB.poolInstance;
    }

    /**
     * Initialize the db connection. This needs to be called once during startup.
     *
     * @static
     * @param {(label: string) => void} callbackSuccess
     * @param {(label: string, err: Error) => void} callbackError
     * @memberof DB
     */
    public static initPool(
        callbackSuccess: (label: string) => void,
        callbackError: (label: string, err: Error) => void
    ): void {
        if (DB.poolInstance) DB.poolInstance.end();

        const sslConnOptions: ConnectionOptions = {};
        if (DBCredentials.getUseSSL()) {
            sslConnOptions.rejectUnauthorized = true;
            try {
                sslConnOptions.ca = Buffer.from(DBCredentials.getSSLCA(), 'base64').toString();
            } catch (err) {
                logger.warn(
                    "Cannot get CA from environment variable DB_SSL_CA. Self-signed certificates in DB connection won't work!"
                );
            }
        }

        const pool = new Pool({
            user: DBCredentials.getUser(),
            host: DBCredentials.getHost(),
            database: DBCredentials.getDB(),
            password: DBCredentials.getPassword(),
            port: DBCredentials.getPort(),
            ssl: DBCredentials.getUseSSL() ? sslConnOptions : false
        });
        logger.info(
            `Created pool. Currently: ${pool.totalCount} Clients (${pool.idleCount} idle, ${pool.waitingCount} busy)`
        );
        pool.connect((err, client, release) => {
            logger.info('Trying query...');
            if (err) {
                return callbackError('PostgreSQL', err);
            }
            client.query('SELECT NOW()', (nowErr, result) => {
                release();
                if (nowErr) {
                    return callbackError('PostgreSQL', nowErr);
                }
                logger.info(`SELECT NOW() => ${JSON.stringify(result.rows)}`);
                DB.poolInstance = pool;
                return callbackSuccess('PostgreSQL');
            });
        });
    }
}
