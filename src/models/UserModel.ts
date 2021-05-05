/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';

import { Logger } from '@overnightjs/logger';

import { UserEntry } from '../types';
import DB from '../server/DB';

import { GcsStateModel } from '../services/GcsStateModel';
import { StateModel } from '../services/StateModel';
export class UserModel {
    private gcsStateModel: StateModel = new GcsStateModel();

    /**
     * Update the users current questionnaire, the start and due date and short interval usage.
     *
     * @param studyId The user id
     * @param parameters Parameters as json
     */
    public async updateUser(studyId: string, parameters = '{}'): Promise<UserEntry> {
        const pool: Pool = DB.getPool();

        try {
            // retrieve user from db
            const query_result = await pool.query('SELECT * FROM studyuser WHERE study_id = $1', [
                studyId
            ]);

            if (query_result.rows.length !== 1) {
                throw new Error('study_id_not_found');
            }
            const user = query_result.rows[0] as UserEntry;

            // calculate new state values
            const updatedUser = this.gcsStateModel.calculateUpdatedData(user, parameters);

            // persist changes
            await pool.query(
                `update
                    studyuser
                set
                    current_questionnaire_id = $1,
                    start_date = $2,
                    due_date = $3,
                    current_instance_id = $4,
                    current_interval = $5,
                    additional_iterations_left = $6
                where
                    study_id = $7
                `,
                [
                    updatedUser.current_questionnaire_id,
                    updatedUser.start_date,
                    updatedUser.due_date,
                    updatedUser.current_instance_id,
                    updatedUser.current_interval,
                    updatedUser.additional_iterations_left,
                    updatedUser.study_id
                ]
            );

            return user;
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    /**
     * Retreieve the user from the database and eventually update the users data in case due_date ist outdated or start_date is not set.
     *
     * @param studyID The user id
     */
    public async getAndUpdateUserByStudyID(studyID: string): Promise<UserEntry> {
        const pool: Pool = DB.getPool();

        try {
            const res = await pool.query('SELECT * FROM studyuser WHERE study_id = $1', [studyID]);

            if (res.rows.length !== 1) {
                throw new Error('study_id_not_found');
            }

            let user = res.rows[0] as UserEntry;
            if (!user.start_date || (user.due_date && user.due_date < new Date())) {
                // TODO rewrite updateUser to take a existing user object
                user = await this.updateUser(user.study_id);
            }
            return user;
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    /**
     * Update the last action field of the user
     * @param studyID The user id
     */
    public async updateLastAction(studyID: string): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query('UPDATE studyuser SET last_action = $1 WHERE study_id = $2;', [
                new Date(),
                studyID
            ]);
            return;
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    /**
     * Check if the given user exists in the database.
     * @param studyID The user id
     */
    public async checkLogin(studyID: string): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('SELECT study_id FROM studyuser WHERE study_id = $1', [
                studyID
            ]);
            if (res.rows.length !== 1) {
                return false;
            } else {
                return true;
            }
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    /**
     * Retrieve all study ids / user ids for which a questionnair is available for download.
     *
     * @param referenceDate The reference date used to determine matching user ids
     */
    public async getUsersWithAvailableQuestionnairs(referenceDate: Date): Promise<string[]> {
        // conditions - Start_Date and Due_Date in study_user is set && Due_Date is not reached && no entry in History table present
        try {
            const pool: Pool = DB.getPool();
            const dateParam = this.convertDateToQueryString(referenceDate);
            const res = await pool.query(
                `select
                    s.study_id
                from
                    studyuser s
                left join questionnairehistory q on
                    s.study_id = q.study_id
                    and s.current_questionnaire_id = q.questionnaire_id
                    and s.current_instance_id = q.instance_id
                where
                    q.id is null
                    and s.start_date <= $1
                    and s.due_date >= $1
                `,
                [dateParam]
            );
            return res.rows.map((user) => user.study_id);
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    /**
     * Retrieve all study ids / user ids for which a questionnair response should be uploaded.
     *
     * @param referenceDate The reference date used to determine matching user ids
     */
    public async getUsersWithPendingUploads(referenceDate: Date): Promise<string[]> {
        // conditions - Start_Date and Due_Date in study_user is set && Due_Date is not reached && one entry in History table with date_sent == null is present
        try {
            const pool: Pool = DB.getPool();
            const dateParam = this.convertDateToQueryString(referenceDate);
            const res = await pool.query(
                `select
                    s.study_id
                from
                    studyuser s,
                    questionnairehistory q
                where
                    s.start_date <= $1
                    and s.due_date >= $1
                    and q.study_id = s.study_id
                    and q.questionnaire_id = s.current_questionnaire_id
                    and q.instance_id = s.current_instance_id
                    and q.date_sent is null
                `,
                [dateParam]
            );
            return res.rows.map((user) => user.study_id);
        } catch (err) {
            Logger.Err(err);
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
        Logger.Imp('Converted [' + date + '] to [' + convertedDate + ']');
        return convertedDate;
    }
}
