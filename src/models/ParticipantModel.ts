import { OrscfStateModel } from './OrscfStateModel';
/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';

import logger from 'jet-logger';

import { StateChangeTrigger, ParticipationStatus, ParticipantEntry } from '../types';
import { DB } from '../server/DB';
import { StateModel } from './StateModel';
export class ParticipantModel {
    // the model that determines which questionnaire to send - replace this with you custom model
    private stateModel: StateModel = new OrscfStateModel();

    /**
     * Update the participants current questionnaire, the start and due date and short interval usage.
     *
     * @param subjectId The participant id
     * @param parameters Parameters as json
     */
    public async updateParticipant(
        subjectId: string,
        parameters = '{}'
    ): Promise<ParticipantEntry> {
        const pool: Pool = DB.getPool();

        try {
            // retrieve participant from db
            const query_result = await pool.query(
                'SELECT * FROM studyparticipant WHERE subject_id = $1',
                [subjectId]
            );

            if (query_result.rows.length !== 1) {
                throw new Error('subject_id_not_found');
            }
            const participant = query_result.rows[0] as ParticipantEntry;

            // calculate new state values
            const triggerValues: StateChangeTrigger = JSON.parse(parameters);
            const updatedParticipant = await this.stateModel.calculateUpdatedData(
                participant,
                triggerValues
            );

            // persist changes
            await pool.query(
                `UPDATE
                    studyparticipant
                SET
                    current_questionnaire_id = $1,
                    start_date = $2,
                    due_date = $3,
                    current_instance_id = $4,
                    current_interval = $5,
                    additional_iterations_left = $6,
                    status = $7
                WHERE
                    subject_id = $8
                `,
                [
                    updatedParticipant.current_questionnaire_id,
                    updatedParticipant.start_date,
                    updatedParticipant.due_date,
                    updatedParticipant.current_instance_id,
                    updatedParticipant.current_interval,
                    updatedParticipant.additional_iterations_left,
                    updatedParticipant.status,
                    updatedParticipant.subject_id
                ]
            );
            return updatedParticipant;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Retrieve the participant from the database and eventually update the participants data in case due_date is outdated, start_date is not set, or study end dates are outdated.
     *
     * @param subjectID The participant id
     * @param updateParticipant whether or not to update the participant
     */
    public async getParticipantBySubjectID(
        subjectID: string,
        updateParticipant = false
    ): Promise<ParticipantEntry> {
        const pool: Pool = DB.getPool();

        try {
            const res = await pool.query('SELECT * FROM studyparticipant WHERE subject_id = $1', [
                subjectID
            ]);
            if (res.rows.length !== 1) {
                throw new Error('subject id not found');
            }
            const participant = res.rows[0] as ParticipantEntry;
            if (updateParticipant) {
                if (
                    !participant.start_date ||
                    (participant.due_date && participant.due_date < new Date()) ||
                    (participant.status == ParticipationStatus['OnStudy'] &&
                        (participant.personal_study_end_date < new Date() ||
                            participant.general_study_end_date < new Date()))
                ) {
                    // TODO rewrite updateParticipant to take an existing participant object and not reload from the db
                    return await this.updateParticipant(participant.subject_id);
                }
            }
            return participant;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Update the last action field of the participant
     * @param subjectID The participant id
     */
    public async updateLastAction(subjectID: string): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query(
                'UPDATE studyparticipant SET last_action = $1 WHERE subject_id = $2;',
                [new Date(), subjectID]
            );
            return;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Check if the participant exists in the database.
     * @param subjectID The participant id
     */
    public async checkLogin(subjectID: string): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query(
                'SELECT subject_id FROM studyparticipant WHERE subject_id = $1',
                [subjectID]
            );
            return res.rows.length === 1;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Retrieve all device tokens for which a questionnaire is available for download.
     *
     * @param referenceDate The reference date used to determine matching participant ids
     */
    public async getParticipantsWithAvailableQuestionnairs(referenceDate: Date): Promise<string[]> {
        // conditions - Start_Date and Due_Date in study_participant is set && Due_Date is not reached && no entry in History table present && subject is on-study
        try {
            const pool: Pool = DB.getPool();
            const dateParam = this.convertDateToQueryString(referenceDate);
            const res = await pool.query(
                `SELECT
                    s.registration_token
                FROM
                    studyparticipant s
                LEFT JOIN questionnairehistory q ON
                    s.subject_id = q.subject_id
                    AND s.current_questionnaire_id = q.questionnaire_id
                    AND s.current_instance_id = q.instance_id
                WHERE
                    q.id IS NULL
                    AND s.start_date <= $1
                    AND s.due_date >= $1
                    AND s.status = $2
                `,
                [dateParam, ParticipationStatus['OnStudy']]
            );
            return res.rows.map((participant) => participant.registration_token);
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Retrieve all device tokens for which a questionnaire is available for download.
     *
     * @param referenceDate The reference date used to determine matching participant ids
     */
    public async getParticipantsWithPendingUploads(referenceDate: Date): Promise<string[]> {
        // conditions - Start_Date and Due_Date in study_participant is set && Due_Date is not reached && one entry in History table with date_sent == null is present && subject is on-study
        try {
            const pool: Pool = DB.getPool();
            const dateParam = this.convertDateToQueryString(referenceDate);
            const res = await pool.query(
                `SELECT
                    s.registration_token
                FROM
                    studyparticipant s,
                    questionnairehistory q
                WHERE
                    s.start_date <= $1
                    AND s.due_date >= $1
                    AND q.subject_id = s.subject_id
                    AND q.questionnaire_id = s.current_questionnaire_id
                    AND q.instance_id = s.current_instance_id
                    AND q.date_sent is null
                    AND s.status = $2
                `,
                [dateParam, ParticipationStatus['OnStudy']]
            );
            return res.rows.map((participant) => participant.registration_token);
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Store the device registration token for the given participant.
     *
     * @param {string} subjectID The ID of the participant.
     * @param {*} token The device token to store.
     */
    public async updateDeviceToken(subjectID: string, token: string): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query(
                'UPDATE studyparticipant SET registration_token = $1 WHERE subject_id = $2;',
                [token, subjectID]
            );
            return;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Store the language code for the given participant.
     *
     * @param {string} language The preferred language of the participant.
     */
    public async updateLanguageCode(subjectID: string, language: string): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query(
                'UPDATE studyparticipant SET language_code = $1 WHERE subject_id = $2;',
                [language, subjectID]
            );
            return;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     * Converts a Javascript Date to Postgres-acceptable format.
     *
     * @param date The Date object
     */
    private convertDateToQueryString(date: Date): string {
        const convertedDate = date.toISOString().replace('T', ' ').replace('Z', '');
        logger.imp('Converted [' + date + '] to [' + convertedDate + ']');
        return convertedDate;
    }
}
