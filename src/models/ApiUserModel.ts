/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';

import logger from 'jet-logger';

import { DB } from '../server/DB';
import { ApiUserEntry } from '../types/ApiUserEntry';

/**
 * Model class that bundles the logic for access to the "apiuser" table.
 *
 * @export
 * @class ApiUserModel
 */
export class ApiUserModel {
    /**
     * Find an api user by the given ID.
     *
     * @param {string} apiID
     * @return {*}
     * @memberof ApiUserModel
     */
    public async getApiUserByID(apiID: string): Promise<ApiUserEntry> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('SELECT * FROM apiuser WHERE api_id = $1', [apiID]);
            if (res.rows.length !== 1) {
                throw new Error('api_id_not_found');
            } else {
                return res.rows[0] as ApiUserEntry;
            }
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Check if an entry in the database for the given apiID exists.
     *
     * @param {string} apiID
     * @return {*}
     * @memberof ApiUserModel
     */
    public async checkIfExists(apiID: string): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('SELECT * FROM apiuser WHERE api_id = $1', [apiID]);
            if (res.rows.length !== 1) {
                return false;
            } else {
                return true;
            }
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }
}
