/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';

import logger from 'jet-logger';

import { StateChangeTrigger, ParticipationStatus, ParticipantEntry } from '../types';
import { DB } from '../server/DB';
import { ExampleStateModel } from './ExampleStateModel';
import { StateModel } from './StateModel';
export class ParticipantModel {
    // the model that determines which questionnaire to send - replace this with you custom model
    private stateModel: StateModel = new ExampleStateModel();

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
                'select * from studyparticipant where subject_id = $1',
                [subjectId]
            );

            if (query_result.rows.length !== 1) {
                throw new Error('subject_id_not_found');
            }
            const participant = query_result.rows[0] as ParticipantEntry;

            // calculate new state values
            const triggerValues: StateChangeTrigger = JSON.parse(parameters);
            const updatedParticipant = this.stateModel.calculateUpdatedData(
                participant,
                triggerValues
            );

            // persist changes
            await pool.query(
                `update
                    studyparticipant
                set
                    current_questionnaire_id = $1,
                    start_date = $2,
                    due_date = $3,
                    current_instance_id = $4,
                    current_interval = $5,
                    additional_iterations_left = $6,
                    status = $7
                where
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
     */
    public async getAndUpdateParticipantBySubjectID(subjectID: string): Promise<ParticipantEntry> {
        const pool: Pool = DB.getPool();

        try {
            const res = await pool.query('select * from studyparticipant where subject_id = $1', [
                subjectID
            ]);
            if (res.rows.length !== 1) {
                throw new Error('subject_id_not_found');
            }

            let participant = res.rows[0] as ParticipantEntry;
            if (
                !participant.start_date ||
                (participant.due_date && participant.due_date < new Date()) ||
                (participant.status == ParticipationStatus['OnStudy'] &&
                    (participant.personal_study_end_date < new Date() ||
                        participant.general_study_end_date < new Date()))
            ) {
                // TODO rewrite updateParticipant to take an existing participant object and not reload from the db
                participant = await this.updateParticipant(participant.subject_id);
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
                'update studyparticipant set last_action = $1 where subject_id = $2;',
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
                'select subject_id from studyparticipant where subject_id = $1',
                [subjectID]
            );
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
                `select
                    s.registration_token
                from
                    studyparticipant s
                left join questionnairehistory q on
                    s.subject_id = q.subject_id
                    and s.current_questionnaire_id = q.questionnaire_id
                    and s.current_instance_id = q.instance_id
                where
                    q.id is null
                    and s.start_date <= $1
                    and s.due_date >= $1
                    and s.status = $2
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
                `select
                    s.registration_token
                from
                    studyparticipant s,
                    questionnairehistory q
                where
                    s.start_date <= $1
                    and s.due_date >= $1
                    and q.subject_id = s.subject_id
                    and q.questionnaire_id = s.current_questionnaire_id
                    and q.instance_id = s.current_instance_id
                    and q.date_sent is null
                    and s.status = $2
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
                'update studyparticipant set registration_token = $1 where subject_id = $2;',
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
                'update studyparticipant set language_code = $1 where subject_id = $2;',
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
