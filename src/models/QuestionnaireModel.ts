/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import { Logger } from '@overnightjs/logger';

import { COMPASSConfig } from '../config/COMPASSConfig';
import { UserModel } from '../models/UserModel';
import DB from '../server/DB';

/**
 * Model class that bundles the logic for access to the questionnaire related tables.
 *
 * @export
 * @class QuestionnaireModel
 */
export class QuestionnaireModel {
    private userModel: UserModel = new UserModel();

    /**
     * Retrieve the questionnaire with the requested ID and create a log entry in the questionnairehistory table.
     *
     * @param {string} studyID
     * @param {string} questionnaireId
     * @return {*}  {Promise<string>}
     * @memberof QuestionnaireModel
     */
    public async getQuestionnaire(studyID: string, questionnaireId: string): Promise<string> {
        // note: we don't try/catch this because if connecting throws an exception
        // we don't need to dispose the client (it will be undefined)
        const dbClient = await DB.getPool().connect();

        try {
            const user = await this.userModel.getAndEventuallyUpdateUserByStudyID(studyID);
            const res = await dbClient.query('SELECT body FROM questionnaires WHERE id = $1', [
                questionnaireId
            ]);

            const dbId =
                questionnaireId +
                '-' +
                studyID +
                '-' +
                (user.current_instance_id || COMPASSConfig.getInitialQuestionnaireId());
            await dbClient.query(
                'INSERT INTO questionnairehistory(id, study_id, questionnaire_id, date_received, date_sent, instance_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING;',
                [
                    dbId,
                    studyID,
                    questionnaireId,
                    new Date(),
                    null,
                    user.current_instance_id || COMPASSConfig.getInitialQuestionnaireId()
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
}
