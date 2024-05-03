import { SearchFilterService } from './../services/SearchFilterService';
/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';
import format from 'pg-format';
import logger from 'jet-logger';
import { DB } from '../server/DB';
import { SdrMappingHelper } from './../services/SdrMappingHelper';
import { ParticipantEntry } from './../types/ParticipantEntry';
import * as SdrDtos from 'orscf-subjectdata-contract';
import * as SdrModels from 'orscf-subjectdata-contract';
import { StateModel } from './StateModel';
import { OrscfStateModel } from './OrscfStateModel';
import { QuestionnaireModel } from './QuestionnaireModel';
import { IdHelper } from '../services/IdHelper';
import { COMPASSConfig } from '../config/COMPASSConfig';

export class SubjectIdentitiesModel {
    private stateModel: StateModel = new OrscfStateModel();
    private questIonnaireHistoryModel = new QuestionnaireModel();

    /**
     * Verify if participant exists in database.
     * @param subjectID The participant id
     */
    public async getSubjectIdentityExistence(subjectID: string): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('SELECT * FROM studyparticipant WHERE subject_id = $1', [
                subjectID
            ]);

            if (res.rows.length !== 1) {
                return false;
            }
            return true;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async getSubjectIdentityExistenceBySubjectUid(subjectUid: string): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('SELECT * FROM studyparticipant WHERE subject_uid = $1', [
                subjectUid
            ]);

            if (res.rows.length !== 1) {
                return false;
            }
            return true;
        } catch (err) {
            logger.err(err);
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
            logger.err(err);
            throw err;
        }
        return;
    }

    public async createStudyParticipant(studyParticipant: ParticipantEntry): Promise<void> {
        try {
            const pool: Pool = DB.getPool();

            //studyParticipant = await this.stateModel.calculateUpdatedData(studyParticipant, {});
            studyParticipant.current_instance_id = IdHelper.createID();
            studyParticipant.current_questionnaire_id = COMPASSConfig.getInitialQuestionnaireId();

            await pool.query(
                `INSERT INTO studyparticipant VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
                [
                    studyParticipant.subject_id,
                    studyParticipant.last_action,
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
                    studyParticipant.language_code,
                    studyParticipant.subject_uid,
                    studyParticipant.study_uid,
                    studyParticipant.actual_site_uid,
                    studyParticipant.enrolling_site_uid,
                    studyParticipant.actual_site_defined_patient_identifier
                ]
            );

            await this.questIonnaireHistoryModel.createQuestionnaireHistoryEntry(
                studyParticipant.subject_id,
                studyParticipant.current_questionnaire_id,
                studyParticipant.current_instance_id,
                studyParticipant.language_code
            );
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    /**
     *
     * @param studyParticipant PRESEVES the iteration specific values!
     */
    public async updateStudyParticipant(studyParticipant: ParticipantEntry): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query(
                `UPDATE studyparticipant
                SET
                    subject_id = $1,
                    start_date = $2,
                    due_date = $3,
                    status = $4,
                    general_study_end_date = $5,
                    personal_study_end_date = $6,
                    subject_uid = $7,
                    study_uid = $8,
                    actual_site_uid = $9,
                    enrolling_site_uid = $10,
                    actual_site_defined_patient_identifier = $11
                WHERE subject_uid = $7`,
                [
                    studyParticipant.subject_id,
                    studyParticipant.start_date,
                    studyParticipant.due_date,
                    studyParticipant.status,
                    studyParticipant.general_study_end_date,
                    studyParticipant.personal_study_end_date,
                    studyParticipant.subject_uid,
                    studyParticipant.study_uid,
                    studyParticipant.actual_site_uid,
                    studyParticipant.enrolling_site_uid,
                    studyParticipant.actual_site_defined_patient_identifier
                ]
            );
        } catch (err) {
            logger.err(err);
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
                `UPDATE studyparticipant
                SET
                    start_date = $1,
                    status = $2,
                    personal_study_end_date = $3,
                    actual_site_defined_patient_identifier = $4
                WHERE subject_uid = $5 RETURNING subject_uid`,
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
            logger.err(error);
            throw error;
        }
    }

    public async updateSubjects(
        subjectUids: string[],
        mutation: SdrModels.BatchableSubjectMutation
    ): Promise<string[]> {
        try {
            const pool: Pool = DB.getPool();

            const updateQuery = await pool.query(
                format(
                    `UPDATE studyparticipant
                    SET
                        start_date = %L,
                        status = %L,
                        personal_study_end_date = %L
                    WHERE
                        subject_uid in (%L)
                    RETURNING subject_uid`,
                    mutation.periodStart,
                    mutation.status,
                    mutation.periodEnd,
                    subjectUids
                )
            );
            return updateQuery.rows;
        } catch (error) {
            logger.err(error);
            throw error;
        }
    }

    public async deleteStudyParticipant(subjectId: string): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query('DELETE FROM studyparticipant WHERE subject_uid = $1', [subjectId]);
        } catch (err) {
            logger.err(err);
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

            if (searchRequest.limitResults < 1) searchRequest.limitResults = 10000;

            if (searchRequest.filter === undefined || searchRequest.filter == null) {
                searchRequest.filter = {} as SdrModels.SubjectFilter;
            }

            const filterClause: string = SearchFilterService.buildSubjectFilterSqlClause(
                searchRequest.filter,
                'sp'
            );

            const searchQuery = await pool.query(
                format(
                    `SELECT
                        subject_uid AS "subjectUid",
                        subject_id AS "subjectIdentifier",
                        study_uid AS "studyUid",
                        actual_site_uid AS "actualSiteUid",
                        0 AS "isArchived",
                        0 AS modificationTimestampUtc
                    FROM
                        studyparticipant sp %s
                    ORDER BY %I %s
                    LIMIT %s`,
                    filterClause,
                    SdrMappingHelper.mapSdrSubjectPropnameToParticipantPropName(sortingField),
                    sortDescending ? ' DESC' : '',
                    searchRequest.limitResults
                )
            );
            return searchQuery.rows;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async getSubjects(subjectUids: string[]): Promise<SdrModels.SubjectFields[]> {
        try {
            const pool: Pool = DB.getPool();

            const getSubjetsQuery = await pool.query(
                format(
                    `SELECT *
                    FROM
                        studyparticipant
                    WHERE
                        subject_uid in (%L)
                    ORDER BY subject_id`,
                    subjectUids
                )
            );
            return getSubjetsQuery.rows.map((r: ParticipantEntry) =>
                SdrMappingHelper.mapParticipantEntryToSubject(r)
            );
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }
}
