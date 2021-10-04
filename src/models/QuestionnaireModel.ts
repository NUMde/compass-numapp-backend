/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import Logger from 'jet-logger';

import { COMPASSConfig } from '../config/COMPASSConfig';
import { ParticipantModel } from '../models/ParticipantModel';
import DB from '../server/DB';

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
    public async getQuestionnaire(subjectID: string, questionnaireId: string): Promise<string> {
        // note: we don't try/catch this because if connecting throws an exception
        // we don't need to dispose the client (it will be undefined)
        const dbClient = await DB.getPool().connect();

        try {
            const participant = await this.participantModel.getAndUpdateParticipantBySubjectID(
                subjectID
            );
            const res = await dbClient.query('SELECT body FROM questionnaires WHERE id = $1', [
                questionnaireId
            ]);

            const dbId =
                questionnaireId +
                '-' +
                subjectID +
                '-' +
                (participant.current_instance_id || COMPASSConfig.getInitialQuestionnaireId());
            await dbClient.query(
                'INSERT INTO questionnairehistory(id, subject_id, questionnaire_id, date_received, date_sent, instance_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING;',
                [
                    dbId,
                    subjectID,
                    questionnaireId,
                    new Date(),
                    null,
                    participant.current_instance_id || COMPASSConfig.getInitialQuestionnaireId()
                ]
            );

            if (res.rows.length !== 1) {
                throw new Error('questionnaire_not_found');
            } else {
                return res.rows[0].body;
            }
        } catch (e) {
            Logger.Err('!!! DB might be inconsistent. Check DB !!!');
            Logger.Err(e);
            throw e;
        } finally {
            dbClient.release();
        }
    }
    /**
     * Retrieve the questionnaire with the requested url and version. Do not create a log
     *
     * @param {string} url Questionnaire.url
     * @param {string} version Questionnaire.version
     * @return {*}  {Promise<string>}
     * @memberof QuestionnaireModel
     */
    public async getQuestionnaireByUrlAndVersion(url: string, version: string): Promise<string> {
        // note: we don't try/catch this because if connecting throws an exception
        // we don't need to dispose the client (it will be undefined)
        const dbClient = await DB.getPool().connect();

        try {
            const res = await dbClient.query(
                "select body from questionnaires where json_extract_path_text(body, 'url') = $1 and json_extract_path_text(body, 'version') = $2",
                [url, version]
            );
            if (res.rows.length === 0) {
                throw new Error('questionnaire_not_found');
            } else if (res.rows.length > 1) {
                throw new Error('questionnaire_url_and_version_not_unique');
            } else {
                return res.rows[0].body;
            }
        } catch (e) {
            Logger.Err(e);
            throw e;
        } finally {
            dbClient.release();
        }
    }
}
