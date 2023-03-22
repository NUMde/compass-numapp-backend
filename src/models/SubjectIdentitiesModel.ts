import { SearchFilterService } from './../services/SearchFilterService';
/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';
import logger from 'jet-logger';
import { DB } from '../server/DB';
import { SdrMappingHelper } from './../services/SdrMappingHelper';
import { ParticipantEntry } from './../types/ParticipantEntry';
import * as SdrDtos from 'orscf-subjectdata-contract';
import * as SdrModels from 'orscf-subjectdata-contract';
import { StateModel } from './StateModel';
import { OrscfStateModel } from './OrscfStateModel';
import { QuestionnaireModel } from './QuestionnaireModel';

export class SubjectIdentitiesModel {
    private stateModel: StateModel = new OrscfStateModel();
    private questoinnaireHistoryModel = new QuestionnaireModel();

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
            logger.err(err);
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
            studyParticipant = await this.stateModel.calculateUpdatedData(studyParticipant, {});

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

            //HACK getQuestionnaire will create initial entry in questionnairehistory
            this.questoinnaireHistoryModel.getQuestionnaire(
                studyParticipant.subject_id,
                studyParticipant.current_questionnaire_id,
                'DE'
            );
        } catch (err) {
            logger.err(err);
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
            let subjectUidsIn = '';
            // TODO: Performance des womöglich großen where in ???
            let i = 0;
            subjectUids.forEach((subjectUid: string) => {
                subjectUidsIn += `'${subjectUid}'`;
                if (i < subjectUids.length - 1) {
                    subjectUidsIn += ',';
                }
                i += 1;
            });

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
            logger.err(error);
            throw error;
        }
    }

    public async deleteStudyParticipant(subjectId: string): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            await pool.query('DELETE FROM studyparticipant where subject_uid = $1', [subjectId]);
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

            const searchSql = `SELECT \
                subject_uid AS "subjectUid", \
                subject_id AS "subjectIdentifier", \
                study_uid AS "studyUid", \
                actual_site_uid AS "actualSiteUid", \
                0 AS "isArchived", \
                0 AS modiciationTimestampUtc \
                FROM studyparticipant sp ${filterClause}
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
            logger.err(err);
            //return [] as SubjectMetaRecord[];
            throw err;
        }
    }

    public async getSubjects(subjectUids: string[]): Promise<SdrModels.SubjectFields[]> {
        try {
            const pool: Pool = DB.getPool();
            let subjectUidsIn = '';
            // TODO: Performance des womöglich großen where in ???
            let i = 0;
            subjectUids.forEach((subjectUid: string) => {
                subjectUidsIn += `'${subjectUid}'`;
                if (i < subjectUids.length - 1) {
                    subjectUidsIn += ',';
                }
                i += 1;
            });

            const getSubjetsQuery = await pool.query(
                `SELECT * \
                FROM studyparticipant where subject_uid in (${subjectUidsIn}) \
                ORDER BY subject_id
                `
            );
            return getSubjetsQuery.rows.map((r) =>
                SdrMappingHelper.mapParticipantEntryToSubject(r)
            );
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }
}
