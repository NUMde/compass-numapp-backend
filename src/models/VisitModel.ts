import { SearchFilterService } from './../services/SearchFilterService';
import { QuestionnaireModel } from './QuestionnaireModel';
import { VdrMappingHelper } from './../services/VdrMappingHelper';
import { OrscfAuthConfig } from './../config/OrscfAuthConfig';
import { Pool } from 'pg';
import format from 'pg-format';
import logger from 'jet-logger';
import { DB } from '../server/DB';
import * as VdrModels from 'orscf-visitdata-contract';
import * as VdrDtos from 'orscf-visitdata-contract';
import { ParticipantModel } from './ParticipantModel';

export class VisitModel {
    private questionnaireModel: QuestionnaireModel = new QuestionnaireModel();
    private participantModel: ParticipantModel = new ParticipantModel();

    public async getDataRecordingExistence(datarecordingId: string): Promise<boolean> {
        try {
            const pool: Pool = DB.getPool();
            const res = await pool.query('select * from datarecordings where id = $1', [
                datarecordingId
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

    public async applyVisitMutation(
        _visitUid: string,
        _visit: VdrModels.VisitMutation
    ): Promise<boolean> {
        //TODO: also needs refactoring to use the 'history' table instead of 'visits'
        throw { message: 'Not implemented in the backend!' };
    }

    public async createVisit(visit: VdrModels.VisitStructure): Promise<void> {
        try {
            const studyUid = OrscfAuthConfig.getStudyUid();
            if (visit.studyUid != studyUid) {
                throw { message: "This backend is dedicated for studyUid '" + studyUid + "'" };
            }

            throw { message: 'Not implemented in the backend!' };
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async updateVisit(visit: VdrModels.VisitStructure): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            const participant = await this.participantModel.getParticipantBySubjectID(
                visit.subjectIdentifier
            );

            const res = await pool.query('SELECT * FROM questionnaires WHERE id = $1', [
                visit.visitProcedureName
            ]);
            if (res.rows.length == 0) {
                throw {
                    message:
                        "There must be a questionnaire named '" +
                        visit.visitProcedureName +
                        "' inside of the DB!"
                };
            }

            //we want to offer any update-logic ONLY FOR THE NEXT QUESTIONNAIRE!
            if (participant.current_instance_id !== visit.visitUid) {
                throw {
                    message:
                        'Cannot update visit "' +
                        visit.visitUid +
                        '", because this is only allowed for visit "' +
                        participant.current_instance_id +
                        '", which is the current visit of participant "' +
                        participant.subject_id +
                        '"!'
                };
            }

            //ONLY 'due_date' & 'questionnaireId' CAN BE UPDATED,
            //and last one must be updated on participants AND history table synchronously:

            await pool.query(
                'UPDATE public.studyparticipant SET due_date = $1, current_questionnaire_id = $2 WHERE subject_id = $3',
                [visit.scheduledDateUtc, visit.visitProcedureName, visit.subjectIdentifier]
            );

            await pool.query(
                'UPDATE public.questionnairehistory SET questionnaire_id = $1 WHERE instance_id = $2',
                [visit.visitProcedureName, visit.visitUid]
            );

            //after changing the 'questionnaireId', the 'id' of the history-
            //record becomes inconsistent and needs to be re-calculated:
            await pool.query(
                "UPDATE public.questionnairehistory SET id = CONCAT(questionnaire_id,'-',subject_id,'-',instance_id) WHERE instance_id = $1",
                [visit.visitUid]
            );
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async createDataRecording(dr: VdrModels.DataRecordingStructure): Promise<void> {
        try {
            const pool: Pool = DB.getPool();

            await pool.query(
                `
            INSERT INTO datarecordings VALUES ($1, $2, §3, $4, $5, $6, $7, $8, $9
            )`,
                [
                    dr.dataRecordingUid,
                    dr.modificationTimestampUtc,
                    dr.dataRecordingName,
                    dr.taskExecutionTitle,
                    dr.scheduledDateTimeUtc,
                    dr.executionDateTimeUtc,
                    dr.executionState,
                    dr.dataSchemaUrl,
                    dr.notesRegardingOutcome,
                    dr.executingPerson,
                    dr.visitUid,
                    dr.recordedData
                ]
            );

            await this.createQuestionnaireIfNotExists(dr);
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    private async createQuestionnaireIfNotExists(dr: VdrModels.DataRecordingStructure) {
        //hard coded until feature 'track-support' is coming
        const questionnaireVersion = '1.0.0';
        const questionnaireName = dr.dataSchemaUrl + '|' + questionnaireVersion;
        const questionnaireBody = JSON.stringify({ url: dr.dataSchemaUrl });
        const existingQuestionnaire: string[] =
            await this.questionnaireModel.getQuestionnaireByUrlAndVersion(
                dr.dataSchemaUrl,
                questionnaireVersion
            );
        if (existingQuestionnaire.length == 0) {
            await this.questionnaireModel.addQuestionnaire(
                dr.dataSchemaUrl,
                questionnaireVersion,
                questionnaireName,
                questionnaireBody
            );
        }
    }

    public async updateDataRecording(dr: VdrModels.DataRecordingStructure): Promise<void> {
        try {
            const pool: Pool = DB.getPool();

            await pool.query(
                format(
                    `UPDATE
                        datarecordings
                    SET
                        visit_id = $s,
                        modification_timestamp_utc =  $s,
                        data_recording_name = %s,
                        task_execution_title = %s,
                        scheduled_date_utc = %s,
                        execution_date_utc = %s,
                        execution_state =  %s,
                        data_scheme_url = %s',
                        notes_regarding_outcome = %s,
                        execution_person = %s,
                        recorded_data = %s
                    WHERE id = %s`,
                    dr.visitUid,
                    dr.modificationTimestampUtc,
                    dr.dataRecordingName,
                    dr.taskExecutionTitle,
                    dr.scheduledDateTimeUtc,
                    dr.executionDateTimeUtc,
                    dr.executionState,
                    dr.dataSchemaUrl,
                    dr.notesRegardingOutcome,
                    dr.executingPerson,
                    dr.recordedData,
                    dr.dataRecordingUid
                )
            );

            await this.createQuestionnaireIfNotExists(dr);
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async searchChangedVisits(
        searchRequest: VdrDtos.SearchChangedVisitsRequest,
        minTimestampUtc: number
    ): Promise<VdrModels.VisitMetaRecord[]> {
        const pool: Pool = DB.getPool();

        const searchSql = this.GetSearchVisitsSql_QuestionnaireHistory(
            searchRequest,
            'visitUid',
            true,
            minTimestampUtc
        );

        const searchQuery = await pool.query(searchSql);
        return searchQuery.rows;
    }

    public async searchVisits(
        searchRequest: VdrDtos.SearchVisitsRequest,
        minTimestampUtc: Date,
        sortingField: string,
        sortDescending: boolean
    ): Promise<VdrModels.VisitMetaRecord[]> {
        try {
            const pool: Pool = DB.getPool();

            const searchSql = this.GetSearchVisitsSql_QuestionnaireHistory(
                searchRequest,
                sortingField,
                sortDescending,
                0
            );

            const searchQuery = await pool.query(searchSql);
            return searchQuery.rows;
        } catch (err) {
            logger.err(err);
            //return [] as SubjectMetaRecord[];
            throw err;
        }
    }

    private GetSearchVisitsSql(
        searchRequest: VdrDtos.SearchVisitsRequest,
        sortingField: string,
        sortDescending: boolean,
        minTimestampUtc: number
    ) {
        if (searchRequest.limitResults < 1) searchRequest.limitResults = 10000;
        if (!searchRequest.filter) {
            searchRequest.filter = {} as VdrModels.VisitFilter;
        }

        const filterClause: string = SearchFilterService.buildVisitFilterSqlClause(
            searchRequest.filter,
            minTimestampUtc,
            'v'
        );

        return format(
            `SELECT
                id AS "visitUid",
                study_uid AS "studyUid",
                site_uid AS "siteUid",
                subject_identifier AS "subjectIdentifier",
                0 AS "isArchived",
                0 AS modificationTimestampUtc
            FROM
                visits v $s
            ORDER BY $I %s
            %s`,
            filterClause,
            VdrMappingHelper.mapVdrPropnameToDbName(sortingField),
            sortDescending ? ' DESC' : '',
            searchRequest.limitResults ? `LIMIT ${searchRequest.limitResults}` : ''
        );
    }

    private GetSearchVisitsSql_QuestionnaireHistory(
        searchRequest: VdrDtos.SearchVisitsRequest,
        sortingField: string,
        sortDescending: boolean,
        minTimestampUtc: number
    ) {
        if (searchRequest.limitResults < 1) searchRequest.limitResults = 10000;
        if (!searchRequest.filter) {
            searchRequest.filter = {} as VdrModels.VisitFilter;
        }

        const filterClause: string =
            SearchFilterService.buildVisitFilterSqlClause_QuestionnaireHistory(
                searchRequest.filter,
                minTimestampUtc,
                'v'
            );

        const studyUid = OrscfAuthConfig.getStudyUid();
        return format(
            `SELECT
                instance_id AS "visitUid",
                %L studyUid,
                '00000000-0000-0000-0000-000000000000' siteUid,
                subject_id AS "subjectIdentifier",
                0 AS "isArchived",
                extract(epoch from date_received) AS modificationTimestampUtc
            FROM questionnairehistory v %s
            ORDER BY %I %s`,
            studyUid,
            filterClause,
            VdrMappingHelper.mapVdrPropnameToDbName(sortingField),
            sortDescending ? 'DESC' : '',
            searchRequest.limitResults ? ` LIMIT ${searchRequest.limitResults}` : ''
        );
    }

    public async getVisits(visitUids: string[]): Promise<VdrModels.VisitFields[]> {
        try {
            const pool: Pool = DB.getPool();

            const getVisitsQuery = await pool.query(
                `SELECT
                        id "visitUid",
                        study_uid "studyUid",
                        site_uid "siteUid",
                        subject_identifier "subjectIdentifier",
                        modification_timestamp_utc "modificationTimestampUtc",
                        visit_procedure_name "visitProcedureName",
                        visit_execution_title "visitExecutionTitle",
                        scheduled_date_utc "scheduleDateUtc",
                        execution_date_utc "executionDateUtc",
                        execution_state "executionState",
                        execution_person "executingPerson",
                    FROM visits where id in $1`,
                [visitUids]
            );
            return getVisitsQuery.rows;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async getVisits_QuestionnaireHistory(
        visitUids: string[]
    ): Promise<VdrModels.VisitFields[]> {
        try {
            const pool: Pool = DB.getPool();

            const studyUid = OrscfAuthConfig.getStudyUid();

            const getVisitsQuery = await pool.query(
                format(
                    `SELECT
                        q.instance_id "visitUid",
                        %L "studyUid",
                        '00000000-0000-0000-0000-000000000000' "siteUid",
                        s.subject_id "subjectIdentifier",
                        EXTRACT(EPOCH FROM DATE_RECEIVED) "modificationTimestampUtc",
                        questionnaire_id "visitProcedureName",
                        questionnaire_id "visitProcedureTitle",
                        CASE
                            WHEN q.DATE_SENT IS NULL THEN S.DUE_DATE
                            ELSE Q.DATE_SENT
                        END "scheduledDateUtc",
                        CASE
                            WHEN Q.DATE_SENT IS NULL THEN NULL
                            ELSE Q.DATE_SENT
                        END "executionDateUtc",
                        CASE
                            WHEN Q.DATE_SENT IS NULL THEN 1
                            ELSE 2
                        END "executionState",
                        'participant' "executingPerson",
                        0 AS "isArchived"
                    FROM studyparticipant AS s
                    INNER JOIN questionnairehistory AS q ON s.subject_id = q.subject_id
                    WHERE q.instance_id IN (%L)`,
                    studyUid,
                    visitUids
                )
            );
            return getVisitsQuery.rows;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async getDataRecordings(visitUid: string): Promise<VdrModels.DataRecordingStructure[]> {
        try {
            const pool: Pool = DB.getPool();

            const getDataRecordingsQuery = await pool.query(
                `SELECT
                        id "dataRecordingUid",
                        visit_id "visitUid",
                        modification_timestamp_utc "modificationTimestampUtc",
                        data_recording_name "dataRecordingName",
                        task_execution_title "taskExecutionTitle",
                        scheduled_date_utc "scheduleDateUtc",
                        execution_date_utc "executionDateUtc",
                        execution_state "executionState",
                        data_scheme_url "dataSchemaUrl",
                        notes_regarding_outcome "notesRegardingOutcome",
                        execution_person "executingPerson",
                        recorded_data "recordedData",
                    FROM datarecordings where visit_id = $1`,
                [visitUid]
            );
            return getDataRecordingsQuery.rows;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }
}
