/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';

import { Request } from 'express';
import logger from 'jet-logger';

import { QueueEntry } from '../types/QueueEntry';
import { COMPASSConfig } from '../config/COMPASSConfig';
import { ParticipantModel } from '../models/ParticipantModel';
import { DB } from '../server/DB';
import { IdHelper } from '../services/IdHelper';

/**
 * Model class that bundles the logic for access to the "queue" table.
 *
 * @export
 * @class QueueModel
 */
export class QueueModel {
    private participantModel: ParticipantModel = new ParticipantModel();

    /**
     * Retrieve study data from the queue.
     *
     * @param {number} limit Number of entries to fetch
     * @param {number} page Page to start the from fetching the data
     * @return {*}
     * @memberof QueueModel
     */
    public async getAvailableQueueData(limit: number, page: number): Promise<QueueEntry[]> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query(
                'SELECT * FROM queue WHERE downloaded=false ORDER BY date_sent ASC LIMIT $1 OFFSET $2',
                [limit, (page - 1) * limit]
            );
            return res.rows as QueueEntry[];
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Retrieve the number of entries in the queue.
     *
     * @return {*}
     * @memberof QueueModel
     */
    public async countAvailableQueueData(): Promise<string> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('SELECT COUNT(*) AS count_queue_data FROM queue');
            // tslint:disable-next-line: no-string-literal
            return res.rows[0]['count_queue_data'];
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Mark data as downloaded
     *
     * @param {string[]} idArray The ids of the entries which shall be marked as 'downloaded'.
     * @return {*} The number of updated entries.
     * @memberof QueueModel
     */
    public async markAsDownloaded(idArray: string[]): Promise<number> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('UPDATE queue SET downloaded=true WHERE id = ANY($1)', [
                idArray
            ]);
            return res.rowCount;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Add study data to the queue.
     *
     * @param {QueueEntry} queueEntry
     * @param {Request} req
     * @return {*}
     * @memberof QueueModel
     */
    public async addDataToQueue(queueEntry: QueueEntry, req: Request): Promise<boolean> {
        // note: we don't try/catch this because if connecting throws an exception
        // we don't need to dispose of the client (it will be undefined)
        const dbClient = await DB.getPool().connect();

        try {
            if (req.query.type === COMPASSConfig.getQuestionnaireResponseType()) {
                // a questionnaire response is send from the client
                const dbID =
                    req.query.surveyId +
                    '-' +
                    req.query.subjectId +
                    '-' +
                    (req.query.instanceId || COMPASSConfig.getInitialQuestionnaireId());
                const res = await dbClient.query(
                    'SELECT * FROM questionnairehistory WHERE id = $1',
                    [dbID]
                );

                if (res.rows.length === 0 || res.rows[0].date_sent !== null) {
                    logger.err('!!! Already sent !!!');
                    return false;
                } else {
                    await dbClient.query(
                        'INSERT INTO queue(id, subject_id, encrypted_resp, date_sent, date_received, questionnaire_id) VALUES ($1, $2, $3, $4, $5, $6)',
                        [
                            IdHelper.createID(),
                            queueEntry.subject_id,
                            queueEntry.encrypted_resp,
                            queueEntry.date_sent,
                            res.rows[0].date_received,
                            queueEntry.questionnaire_id
                        ]
                    );

                    await dbClient.query(
                        'UPDATE questionnairehistory SET date_sent = $1 WHERE id = $2;',
                        [queueEntry.date_sent, dbID]
                    );

                    await this.participantModel.updateParticipant(
                        queueEntry.subject_id,
                        req.query.updateValues as string
                    );
                    return true;
                }
            } else {
                // a report is send from the client
                await dbClient.query(
                    'INSERT INTO queue(id, subject_id, encrypted_resp, date_sent, date_received, questionnaire_id) VALUES ($1, $2, $3, $4, $5, $6)',
                    [
                        IdHelper.createID(),
                        queueEntry.subject_id,
                        queueEntry.encrypted_resp,
                        queueEntry.date_sent,
                        queueEntry.date_received,
                        queueEntry.questionnaire_id
                    ]
                );

                await this.participantModel.updateParticipant(
                    queueEntry.subject_id,
                    req.query.updateValues as string
                );
                return true;
            }
        } catch (e) {
            logger.err('!!! DB might be inconsistent. Check DB !!!');
            logger.err(e);
            throw e;
        } finally {
            dbClient.release();
        }
    }
}
