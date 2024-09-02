/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import logger from 'jet-logger';

import { COMPASSConfig } from '../config/COMPASSConfig';

import { DB } from '../server/DB';
import { IdHelper } from '../services/IdHelper';
import { ParticipantEntry } from '../types';
import { QueryResult } from 'pg';
import format from 'pg-format';

/**
 * Model class that bundles the logic for access to the questionnaire related tables.
 *
 * @export
 * @class QuestionnaireModel
 */
export class QuestionnaireModel {
    /**
     * Retrieve the questionnaire with the requested ID and create a log entry in the questionnairehistory table.
     *
     * @param {string} questionnaireId
     * @param {string} language
     * @return {*}  {Promise<string>}
     * @memberof QuestionnaireModel
     */
    public async getQuestionnaire(questionnaireId: string, language: string): Promise<string> {
        // note: we don't try/catch this because if connecting throws an exception
        // we don't need to dispose the client (it will be undefined)
        const dbClient = await DB.getPool().connect();

        const url = questionnaireId.split('|')[0];

        try {
            let res = await dbClient.query(
                `SELECT
                    body
                FROM
                    questionnaires
                WHERE
                    id = $1 AND language_code = $2`,
                [url, language]
            );

            if (res.rows.length === 0) {
                `User language '${language}' not available, using fallback language '${COMPASSConfig.getDefaultLanguageCode()}'`;

                res = await dbClient.query(
                    `SELECT
                        body
                    FROM
                        questionnaires
                    WHERE
                        id = $1 AND language_code = $2`,
                    [url, COMPASSConfig.getDefaultLanguageCode()]
                );
                if (res.rows.length === 0) {
                    throw new Error('questionnaire_not_found');
                }
            }

            return res.rows[0].body;
        } catch (e) {
            logger.err('!!! DB might be inconsistent. Check DB !!!');
            logger.err(e);
        } finally {
            dbClient.release();
        }
    }

    // create entry in questionnairehistory table
    public async createQuestionnaireHistoryEntry(
        subjectID: string,
        questionnaireID: string,
        instanceID: string,
        languageCode: string = COMPASSConfig.getDefaultLanguageCode()
    ) {
        const dbClient = await DB.getPool().connect();
        const dbId = questionnaireID + '-' + subjectID + '-' + instanceID;
        try {
            await dbClient.query(
                format(
                    `INSERT INTO
                        questionnairehistory(
                            id,
                            subject_id,
                            questionnaire_id,
                            language_code,
                            instance_id)
                     VALUES %L;`,
                    [[dbId, subjectID, questionnaireID, languageCode, instanceID]]
                )
            );
        } catch (error) {
            logger.err(error);
        } finally {
            dbClient.release();
        }
    }

    public async updateEntryForParticipant(subjectID: string) {
        const dbClient = await DB.getPool().connect();

        try {
            const res: QueryResult<ParticipantEntry> = await dbClient.query(
                format(
                    `SELECT
                    *
                FROM
                    studyparticipant
                WHERE
                    subject_id = %L`,
                    [subjectID]
                )
            );
            const participant = res.rows[0];
            const dbId =
                participant.current_questionnaire_id +
                '-' +
                subjectID +
                '-' +
                participant.current_instance_id;
            await dbClient.query(
                format(
                    `UPDATE
                    questionnairehistory
                SET
                date_received = %L
                WHERE
                    id = %L;`,
                    new Date(),
                    dbId
                )
            );
        } catch (error) {
            logger.err(error);
        } finally {
            dbClient.release();
        }
    }

    /**
     * Add the questionnaire with the given id to the list of questionnaires and to the version list of all questionnaires
     *
     * @param {string} url the url of the questionnaire as defined in its metadata
     * @param {string} version the version of the questionnaire as defined in its metadata
     * @param {string} name the name of the questionnaire which also identifies it as configure in the COMPASSConfig
     * @param {object} questionnaire the questionnaire itself as json
     * @return {*}  {Promise<string>}
     * @memberof QuestionnaireModel
     */
    public async addQuestionnaire(
        url: string,
        version: string,
        name: string,
        questionnaire: string,
        languageCode?: string
    ): Promise<void> {
        const dbClient = await DB.getPool().connect();
        try {
            // Make sure there isn't a questionnaire yet with the given id
            const res = await dbClient.query(
                'SELECT * FROM questionnaires WHERE id = $1 AND ($2::text is NULL OR language_code = $2::text)',
                [name]
            );
            if (res.rows.length !== 0) {
                throw { code: 409 };
            }
            await dbClient.query('INSERT INTO questionnaires VALUES($1, $2, $3)', [
                name,
                questionnaire,
                languageCode
            ]);
            dbClient.query(
                'INSERT INTO questionnaire_version_history VALUES($1, $2, $3, $4, $5, $6)',
                [IdHelper.createID(), url, version, name, questionnaire, languageCode]
            );
        } catch (error) {
            logger.err(error);
            throw error;
        } finally {
            dbClient.release();
        }
    }

    /**
     * Update an existing questionnaire and add the new version to the version history.
     *
     * @param {string} url the url of the questionnaire as defined in its metadata
     * @param {string} version the version of the questionnaire as defined in its metadata
     * @param {string} name the name of the questionnaire which also identifies it as configure in the COMPASSConfig
     * @param {object} questionnaire the questionnaire itself as json
     * @return {*}  {Promise<string>}
     * @memberof QuestionnaireModel
     */
    public async updateQuestionnaire(
        url: string,
        version: string,
        name: string,
        questionnaire: string,
        languageCode?: string
    ): Promise<void> {
        const dbClient = await DB.getPool().connect();
        try {
            // Make sure there is no questionnaire present with the given url and version
            const res1 = await dbClient.query(
                'SELECT * FROM questionnaire_version_history WHERE url = $1 AND version = $2 AND ($3::text is NULL or language_code = $3::text)',
                [url, version, languageCode]
            );
            if (res1.rows.length === 1) {
                throw { code: 409 };
            }
            // Make sure there is a questionnaire with the given url and name
            const res2 = await dbClient.query(
                'SELECT * FROM questionnaire_version_history WHERE url = $1 AND name = $2 AND ($3::text is NULL or language_code = $3::text)',
                [url, name]
            );
            if (res2.rows.length === 0) {
                throw { code: 404 };
            }
            await dbClient.query(
                'INSERT INTO questionnaire_version_history VALUES($1, $2, $3, $4, $5, $6)',
                [IdHelper.createID(), url, version, name, questionnaire, languageCode]
            );
            dbClient.query(
                'UPDATE questionnaires SET body = $1 WHERE id = $2 AND ($3::text is NULL or language_code = $3::text) RETURNING id',
                [questionnaire, name, languageCode]
            );
        } catch (error) {
            logger.err(error);
            throw error;
        } finally {
            dbClient.release();
        }
    }

    /**
     * Get a questionnaire identified by url and version
     *
     * @param {string} url
     * @param {string} version
     * @returns{object} the questionnaire object
     */
    public async getQuestionnaireByUrlAndVersion(
        url: string,
        version: string,
        languageCode?: string
    ): Promise<string[]> {
        const dbClient = await DB.getPool().connect();
        try {
            const res = await dbClient.query(
                'SELECT * FROM questionnaire_version_history WHERE url = $1 AND version = $2 AND ($3::text is null or language_code = $3::text)',
                [url, version, languageCode]
            );
            return res.rows;
        } catch (error) {
            logger.err(error);
            throw error;
        } finally {
            dbClient.release();
        }
    }

    /**
     * Get available questionnaire languages
     * @returns{string[]} list of available languages
     */
    public async getQuestionnaireLanguages(): Promise<string[]> {
        const dbClient = await DB.getPool().connect();
        try {
            const res = await dbClient.query('SELECT DISTINCT language_code FROM questionnaires');
            const responseArray = [];
            for (const row of res.rows) {
                responseArray.push(row.language_code);
            }
            return responseArray;
        } catch (error) {
            logger.err(error);
            throw error;
        } finally {
            dbClient.release();
        }
    }
}
