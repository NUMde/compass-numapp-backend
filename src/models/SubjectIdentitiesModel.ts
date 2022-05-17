/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';
import Logger from 'jet-logger';
import { DB } from '../server/DB';
import { SdrMappingHelper } from './../services/SdrMappingHelper';
import { ParticipantEntry } from './../types/ParticipantEntry';
import * as SdrDtos from 'orscf-subjectdata-contract/dtos';
import * as SdrModels from 'orscf-subjectdata-contract/models';

export class SubjectIdentitiesModel {
    /**
     * Verify if participant exists in database.
     * @param subjectID The participant id
     */
    public async getSubjectIdentityExistence(subjectID: string): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('select * from studyparticipant where subject_id = $1', [
                subjectID
            ]);

            if (res.rows.length !== 1) {
                return false;
            }
            return true;
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    public async getSubjectIdentityExistenceBySubjectUid(subjectUid: string): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('select * from studyparticipant where subject_uid = $1', [
                subjectUid
            ]);

            if (res.rows.length !== 1) {
                return false;
            }
            return true;
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    /**
     * Add a new participant
     * @param subjectID The participant id
     */
    public async addNewSubjectIdentity(subjectID: string): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query('INSERT INTO studyparticipant(subject_id) VALUES ($1);', [subjectID]);
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
        return;
    }

    public async createStudyParticipant(studyParticipant: ParticipantEntry): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query(
                'INSERT INTO studyparticipant(\
                    subject_id,\
                    current_questionnaire_id,\
                    start_date,\
                    due_date,\
                    current_instance_id,\
                    current_interval,\
                    additional_iterations_left,\
                    status,\
                    general_study_end_date,\
                    personal_study_end_date,\
                    registration_token,\
                    subject_uid,\
                    study_uid, \
                    actual_site_uid,\
                    enrolling_site_uid,\
                    actual_site_defined_patient_identifier,\
                    last_action\
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)',
                [
                    studyParticipant.subject_id,
                    studyParticipant.current_questionnaire_id,
                    studyParticipant.start_date,
                    studyParticipant.due_date,
                    studyParticipant.current_instance_id,
                    studyParticipant.current_interval,
                    studyParticipant.additional_iterations_left,
                    studyParticipant.status,
                    studyParticipant.general_study_end_date,
                    studyParticipant.personal_study_end_date,
                    null,
                    studyParticipant.subject_uid,
                    studyParticipant.study_uid,
                    studyParticipant.actual_site_uid,
                    studyParticipant.enrolling_site_uid,
                    studyParticipant.actual_site_defined_patient_identifier,
                    studyParticipant.last_action
                ]
            );
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    public async updateStudyParticipant(studyParticipant: ParticipantEntry): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query(
                'UPDATE studyparticipant \
                    set subject_id = $1,\
                    current_questionnaire_id = $2,\
                    start_date = $3,\
                    due_date = $4,\
                    current_instance_id = $5,\
                    current_interval = $6,\
                    additional_iterations_left = $7,\
                    status = $8,\
                    general_study_end_date = $9,\
                    personal_study_end_date = $10,\
                    registration_token = $11,\
                    subject_uid = $12,\
                    study_uid = $13, \
                    actual_site_uid = $14,\
                    enrolling_site_uid = $15,\
                    actual_site_defined_patient_identifier = $16 where subject_uid = $12',
                [
                    studyParticipant.subject_id,
                    studyParticipant.current_questionnaire_id,
                    studyParticipant.start_date,
                    studyParticipant.due_date,
                    studyParticipant.current_instance_id,
                    studyParticipant.current_interval,
                    studyParticipant.additional_iterations_left,
                    studyParticipant.status,
                    studyParticipant.general_study_end_date,
                    studyParticipant.personal_study_end_date,
                    null,
                    studyParticipant.subject_uid,
                    studyParticipant.study_uid,
                    studyParticipant.actual_site_uid,
                    studyParticipant.enrolling_site_uid,
                    studyParticipant.actual_site_defined_patient_identifier
                ]
            );
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    public async updateSubject(
        subjectUid: string,
        subjectMutation: SdrModels.SubjectMutation
    ): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const updateQuery = await pool.query(
                'UPDATE studyparticipant SET \
                    start_date = $1,\
                    status = $2,\
                    personal_study_end_date = $3,\
                    actual_site_defined_patient_identifier = $4 \
                WHERE subject_uid = $5 RETURNING subject_uid',
                [
                    subjectMutation.periodStart,
                    subjectMutation.status,
                    subjectMutation.periodEnd,
                    subjectMutation.actualSiteDefinedPatientIdentifier,
                    subjectUid
                ]
            );
            return updateQuery.rows.length > 0;
        } catch (error) {
            Logger.Err(error);
            throw error;
        }
    }

    public async updateSubjects(
        subjectUids: string[],
        mutation: SdrModels.BatchableSubjectMutation
    ): Promise<string[]> {
        try {
            const pool: Pool = DB.getPool();
            let subjectUidsIn = '';
            // TODO: Performance des womöglich großen where in ???
            for (let i = 0; i < subjectUids.length; i++) {
                const subjectUid: string = subjectUids[i];
                subjectUidsIn += `'${subjectUid}'`;
                if (i < subjectUids.length - 1) {
                    subjectUidsIn += ',';
                }
            }

            const updateQuery = await pool.query(
                `UPDATE studyparticipant SET \
                    start_date = $1,\
                    status = $2,\
                    personal_study_end_date = $3\
                WHERE subject_uid in (${subjectUidsIn}) RETURNING subject_uid`,
                [mutation.periodStart, mutation.status, mutation.periodEnd]
            );
            return updateQuery.rows;
        } catch (error) {
            Logger.Err(error);
            throw error;
        }
    }

    public async deleteStudyParticipant(subjectId: string): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query('DELETE FROM studyparticipant where subject_uid = $1', [subjectId]);
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }

    public async searchParticipants(
        searchRequest: SdrDtos.SearchSubjectsRequest,
        minTimestampUtc: Date,
        sortingField: string,
        sortDescending: boolean
    ): Promise<SdrModels.SubjectMetaRecord[]> {
        try {
            const pool: Pool = DB.getPool();

            if (searchRequest.filter === undefined || searchRequest.filter == null) {
                searchRequest.filter = {} as SdrModels.SubjectFilter;
            }

            const minPeriodStartWhereClause =
                searchRequest.filter.minPeriodStart === undefined
                    ? ''
                    : ` AND '${searchRequest.filter.minPeriodStart}' <= start_date`;

            const maxPeriodStartWhereClause =
                searchRequest.filter.maxPeriodStart === undefined
                    ? ''
                    : ` AND '${searchRequest.filter.maxPeriodStart}' >= start_date`;

            const minPeriodEndWhereClause =
                searchRequest.filter.minPeriodEnd === undefined
                    ? ''
                    : ` AND '${searchRequest.filter.minPeriodEnd}' <= personal_study_end_date`;

            const maxPeriodEndWhereClause =
                searchRequest.filter.maxPeriodEnd === undefined
                    ? ''
                    : ` AND '${searchRequest.filter.maxPeriodEnd}' >= personal_study_end_date`;

            const changeDateWhereClause = '';
            //minTimestampUtc === undefined ? '' : ` AND '${minTimestampUtc}' <= last_action`;

            const timeStampWhereClause =
                minPeriodStartWhereClause +
                maxPeriodStartWhereClause +
                minPeriodEndWhereClause +
                maxPeriodEndWhereClause +
                changeDateWhereClause;

            const searchSql = `SELECT \
                subject_uid AS "subjectUid", \
                subject_id AS "subjectIdentifier", \
                study_uid AS "studyUid", \
                actual_site_uid AS "actualSiteUid", \
                0 AS "isArchived", \
                0 AS modiciationTimestampUtc \
                FROM studyparticipant where \
                    1 = 1 \
                    And (\
                        '${searchRequest.filter.studyUid}' = 'undefined' or \
                        ('${searchRequest.filter.studyUid}' = 'null' and study_uid is null) or \
                        '${searchRequest.filter.studyUid}' = study_uid\
                    ) \
                    And (\
                        '${searchRequest.filter.siteUid}' = 'undefined' or \
                        ('${
                            searchRequest.filter.siteUid
                        }' = 'null' and actual_site_uid is null) or \
                        '${searchRequest.filter.siteUid}' = actual_site_uid\
                    ) \
                    And (\
                        '${searchRequest.filter.subjectIdentifier}' = 'undefined' or \
                        ('${
                            searchRequest.filter.subjectIdentifier
                        }' = 'null' and subject_id is null) or \
                        '${searchRequest.filter.subjectIdentifier}' = subject_id\
                    ) \
                    And (\
                        '${searchRequest.filter.status}' = 'undefined' or \
                        '${searchRequest.filter.status}' = status\
                    ) \
                    And (\
                        '${
                            searchRequest.filter.actualSiteDefinedPatientIdentifier
                        }' = 'undefined' or \
                        ('${
                            searchRequest.filter.actualSiteDefinedPatientIdentifier
                        }' = 'null' and actual_site_defined_patient_identifier is null) or \
                        '${
                            searchRequest.filter.actualSiteDefinedPatientIdentifier
                        }' = actual_site_defined_patient_identifier\
                    ) ${timeStampWhereClause}
                ORDER BY ${SdrMappingHelper.mapSdrSubjectPropnameToParticipantPropName(
                    sortingField
                )} ${sortDescending ? ' DESC' : ''}\
                LIMIT ${searchRequest.limitResults}`;

            const searchQuery = await pool.query(searchSql);
            return searchQuery.rows;

            // const searchQuery2 = await pool.query(`SELECT \
            //     subject_uid AS "subjectUid", \
            //     subject_id AS "subjectIdentifier", \
            //     study_uid AS "studyUid", \
            //     actual_site_uid AS "actualSiteUid", \
            //     0 AS "isArchived", \
            //     0 AS modiciationTimestampUtc \
            //     FROM studyparticipant`);

            // return searchQuery2.rows;
        } catch (err) {
            Logger.Err(err);
            //return [] as SubjectMetaRecord[];
            throw err;
        }
    }

    public async getSubjects(subjectUids: string[]): Promise<SdrModels.SubjectFields[]> {
        try {
            const pool: Pool = DB.getPool();
            let subjectUidsIn = '';
            // TODO: Performance des womöglich großen where in ???
            for (let i = 0; i < subjectUids.length; i++) {
                const subjectUid: string = subjectUids[i];
                subjectUidsIn += `'${subjectUid}'`;
                if (i < subjectUids.length - 1) {
                    subjectUidsIn += ',';
                }
            }

            const getSubjetsQuery = await pool.query(
                `SELECT * \
                FROM studyparticipant where subject_uid in (${subjectUidsIn}) \
                `
            );
            return getSubjetsQuery.rows.map((r) =>
                SdrMappingHelper.mapParticipantEntryToSubject(r)
            );
        } catch (err) {
            Logger.Err(err);
            throw err;
        }
    }
}
