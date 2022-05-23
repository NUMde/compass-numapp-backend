/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import logger from 'jet-logger';

import { COMPASSConfig } from '../config/COMPASSConfig';
import { ParticipantModel } from '../models/ParticipantModel';
import { DB } from '../server/DB';
import { IdHelper } from '../services/IdHelper';

/**
 * Model class that bundles the logic for access to the questionnaire related tables.
 *
 * @export
 * @class QuestionnaireModel
 */
export class QuestionnaireModel {
    private participantModel: ParticipantModel = new ParticipantModel();

    /**
     * Retrieve the questionnaire with the requested ID and create a log entry in the questionnairehistory table.
     *
     * @param {string} subjectID
     * @param {string} questionnaireId
     * @return {*}  {Promise<string>}
     * @memberof QuestionnaireModel
     */
    public async getQuestionnaire(
        subjectID: string,
        questionnaireId: string,
        language: string
    ): Promise<string> {
        // note: we don't try/catch this because if connecting throws an exception
        // we don't need to dispose the client (it will be undefined)
        const dbClient = await DB.getPool().connect();

        try {
            const participant = await this.participantModel.getAndUpdateParticipantBySubjectID(
                subjectID
            );

            const res = await dbClient.query(
                'SELECT body, language_code  FROM questionnaires WHERE id = $1 AND language_code = coalesce ((select language_code from questionnaires where language_code=$2 limit 1), $3);',
                [questionnaireId, language, COMPASSConfig.getDefaultLanguageCode()]
            );

            if (res.rows.length !== 1) {
                throw new Error('questionnaire_not_found');
            } else {
                if (language != res.rows[0].language_code) {
                    logger.info(
                        `User language '${language}' not available, using fallback language '${res.rows[0].language_code}'`
                    );
                }
                const dbId =
                    questionnaireId +
                    '-' +
                    subjectID +
                    '-' +
                    (participant.current_instance_id || COMPASSConfig.getInitialQuestionnaireId());
                await dbClient.query(
                    'INSERT INTO questionnairehistory(id, subject_id, questionnaire_id, language_code, date_received, date_sent, instance_id) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING;',
                    [
                        dbId,
                        subjectID,
                        questionnaireId,
                        res.rows[0].language_code,
                        new Date(),
                        null,
                        participant.current_instance_id || COMPASSConfig.getInitialQuestionnaireId()
                    ]
                );
                return res.rows[0].body;
            }
        } catch (e) {
            logger.err('!!! DB might be inconsistent. Check DB !!!');
            logger.err(e);
            throw e;
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
        questionnaire: string
    ): Promise<void> {
        const dbClient = await DB.getPool().connect();
        try {
            // Make sure there isn't a questionnaire yet with the given id
            const res = await dbClient.query('SELECT * FROM questionnaires WHERE id = $1', [name]);
            if (res.rows.length !== 0) {
                throw { code: 409 };
            }
            await dbClient.query('INSERT INTO questionnaires(id, body) VALUES($1, $2)', [
                name,
                questionnaire
            ]);
            dbClient.query('INSERT INTO questionnaire_version_history VALUES($1, $2, $3, $4, $5)', [
                IdHelper.createID(),
                url,
                version,
                name,
                questionnaire
            ]);
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
        questionnaire: string
    ): Promise<void> {
        const dbClient = await DB.getPool().connect();
        try {
            // Make sure there is no questionnaire present with the given url and version
            const res1 = await dbClient.query(
                'SELECT * FROM questionnaire_version_history WHERE url = $1 AND version = $2',
                [url, version]
            );
            if (res1.rows.length === 1) {
                throw { code: 409 };
            }
            // Make sure there is a questionnaire with the given url and name
            const res2 = await dbClient.query(
                'SELECT * FROM questionnaire_version_history WHERE url = $1 AND name = $2',
                [url, name]
            );
            if (res2.rows.length === 0) {
                throw { code: 404 };
            }
            await dbClient.query(
                'INSERT INTO questionnaire_version_history VALUES($1, $2, $3, $4, $5)',
                [IdHelper.createID(), url, version, name, questionnaire]
            );
            dbClient.query('UPDATE questionnaires SET body = $1 WHERE id = $2 RETURNING id', [
                questionnaire,
                name
            ]);
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
    public async getQuestionnaireByUrlAndVersion(url: string, version: string): Promise<string[]> {
        const dbClient = await DB.getPool().connect();
        try {
            const res = await dbClient.query(
                'SELECT * FROM questionnaire_version_history WHERE url = $1 AND version = $2',
                [url, version]
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
