import { SearchFilterService } from './../services/SearchFilterService';
import { QuestionnaireModel } from './QuestionnaireModel';
import { VdrMappingHelper } from './../services/VdrMappingHelper';
import { OrscfAuthConfig } from './../config/OrscfAuthConfig';
import { Pool } from 'pg';
import logger from 'jet-logger';
import { DB } from '../server/DB';
import * as VdrModels from 'orscf-visitdata-contract';
import * as VdrDtos from 'orscf-visitdata-contract';
//import { COMPASSConfig } from '../config/COMPASSConfig';
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
        visitUid: string,
        visit: VdrModels.VisitMutation
    ): Promise<boolean> {
        //TODO: also needs refactoring to use the 'history' table instead of 'visits'
        throw { message: 'Not implemented in the backend!' };

        try {
            const pool: Pool = DB.getPool();
            let cmd = 'UPDATE visits set';
            let updateNeeded = false;
            if (visit.visitProcedureName !== null) {
                cmd += ` visit_procedure_name = '${visit.visitProcedureName}',`;
                updateNeeded = true;
            }
            if (visit.visitExecutionTitle !== null) {
                cmd += ` visit_execution_title = '${visit.visitExecutionTitle}',`;
                updateNeeded = true;
            }
            if (visit.executionState !== null) {
                cmd += ` execution_state = ${visit.executionState},`;
                updateNeeded = true;
            }
            if (visit.executingPerson !== null) {
                cmd += ` execution_person = '${visit.executingPerson}',`;
                updateNeeded = true;
            }
            if (visit.scheduledDateUtc !== null) {
                cmd += ` scheduled_date_utc = '${visit.scheduledDateUtc}',`;
                updateNeeded = true;
            }
            if (visit.executionDateUtc !== null) {
                cmd += ` execution_date_utc = '${visit.executionDateUtc}',`;
                updateNeeded = true;
            }
            if (!updateNeeded) {
                return false;
            }
            // Remove last comma
            cmd = cmd.slice(0, cmd.length - 1);
            cmd += ` where id = '${visitUid}'`;
            logger.info(cmd);
            const updateQuery = await pool.query(cmd);
            // console.log('update query', updateQuery);
            logger.info(updateQuery);
            return updateQuery.rowCount > 0;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async createVisit(visit: VdrModels.VisitStructure): Promise<void> {
        try {
            const studyUid = OrscfAuthConfig.getStudyUid();
            if (visit.studyUid != studyUid) {
                throw { message: "This backend is dedicated for studyUid '" + studyUid + "'" };
            }

            throw { message: 'Not implemented in the backend!' };

            //TODO: also needs refactoring to use the 'history' table instead of 'visits'
            throw { code: 404 };

            const pool: Pool = DB.getPool();
            const cmd = `INSERT INTO visits(
                study_uid,
                site_uid,
                subject_identifier,
                modification_timestamp_utc,
                visit_procedure_name,
                visit_execution_title,
                scheduled_date_utc,
                execution_date_utc,
                execution_state,
                execution_person,
                id
            ) VALUES (
                '${visit.studyUid}',
                '${visit.siteUid}',
                '${visit.subjectIdentifier}',
                ${visit.modificationTimestampUtc},
                '${visit.visitProcedureName}',
                '${visit.visitExecutionTitle}',
                '${visit.scheduledDateUtc}',
                '${visit.executionDateUtc}',
                 ${visit.executionState},
                '${visit.executingPerson}',
                '${visit.visitUid}'
            )`;
            logger.info(cmd);
            await pool.query(cmd);
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async updateVisit(visit: VdrModels.VisitStructure): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            const participant = await this.participantModel.getAndUpdateParticipantBySubjectID(
                visit.subjectIdentifier
            );

            const res = await pool.query('SELECT * FROM questionnaires WHERE id = $1', [
                visit.visitProcedureName
            ]);
            if (res.rows.length == 0) {
                throw {
                    message:
                        "There must be a questionaire named '" +
                        visit.visitProcedureName +
                        "' inside of the DB!"
                };
            }

            //we want to offer any update-logic ONLY FOR THE NEXT QUESTIONAIRE!
            if (participant.current_instance_id != visit.visitUid) {
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

            //ONLY 'due_date' & 'questionaireId' CAN BE UPDATED,
            //and last one must be updated on participants AND history table synchonously:
            const studyParticipantSql_DueDate_UpdateSql = `update public.studyparticipant set due_date = '${visit.scheduledDateUtc}', current_questionnaire_id = '${visit.visitProcedureName}' where subject_id = '${visit.subjectIdentifier}'`;
            await pool.query(studyParticipantSql_DueDate_UpdateSql);
            const updateQuestionnaireHistory_QuestionaireId_UpdateSqlSql = `update public.questionnairehistory set questionnaire_id = '${visit.visitProcedureName}' where instance_id = '${visit.visitUid}'`;
            await pool.query(updateQuestionnaireHistory_QuestionaireId_UpdateSqlSql);

            //after changing the 'questionaireId', the 'id' of the history-
            //record becomes inconsistent and needs to be re-calculated:
            const questionnaireHistory_Id_RepairSql = `update public.questionnairehistory set id = CONCAT(questionnaire_id,'-',subject_id,'-',instance_id) where instance_id = '${visit.visitUid}'`;
            await pool.query(questionnaireHistory_Id_RepairSql);

            return;

            //OLD WAY with separate visit-table - well be removed in mid term
            const cmd = `update visits set
                study_uid = '${visit.studyUid}',
                site_uid = '${visit.siteUid}',
                subject_identifier = '${visit.subjectIdentifier}',
                modification_timestamp_utc = ${visit.modificationTimestampUtc},
                visit_procedure_name = '${visit.visitProcedureName}',
                visit_execution_title = '${visit.visitExecutionTitle}',
                scheduled_date_utc = '${visit.scheduledDateUtc}',
                execution_date_utc = '${visit.executionDateUtc}',
                execution_state = ${visit.executionState},
                execution_person = '${visit.executingPerson}',
                id = '${visit.visitUid}'
            `;
            logger.info(cmd);
            await pool.query(cmd);
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async createDataRecording(dr: VdrModels.DataRecordingStructure): Promise<void> {
        try {
            const pool: Pool = DB.getPool();
            const cmd = `INSERT INTO datarecordings(
                id,
                visit_id,
                modification_timestamp_utc,
                data_recording_name,
                task_execution_title,
                scheduled_date_utc,
                execution_date_utc,
                execution_state,
                data_scheme_url,
                notes_regarding_outcome,
                execution_person,
                recorded_data
            ) VALUES (
                '${dr.dataRecordingUid}',
                '${dr.visitUid}',
                ${dr.modificationTimestampUtc},
                '${dr.dataRecordingName}',
                '${dr.taskExecutionTitle}',
                '${dr.scheduledDateTimeUtc}',
                '${dr.executionDateTimeUtc}',
                ${dr.executionState},
                '${dr.dataSchemaUrl}',
                '${dr.notesRegardingOutcome}',
                '${dr.executingPerson}',
                '${dr.recordedData}'
            )`;
            logger.info(cmd);
            await pool.query(cmd);

            await this.createQuestionnaireIfNotExisits(dr);
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    private async createQuestionnaireIfNotExisits(dr: VdrModels.DataRecordingStructure) {
        //hard coded until feature 'track-support' is comming
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
            const cmd = `update datarecordings set
                visit_id = '${dr.visitUid}',
                modification_timestamp_utc =  ${dr.modificationTimestampUtc},
                data_recording_name = '${dr.dataRecordingName}',
                task_execution_title = '${dr.taskExecutionTitle}',
                scheduled_date_utc = '${dr.scheduledDateTimeUtc}',
                execution_date_utc = '${dr.executionDateTimeUtc}',
                execution_state =  ${dr.executionState},
                data_scheme_url = '${dr.dataSchemaUrl}',
                notes_regarding_outcome = '${dr.notesRegardingOutcome}',
                execution_person = '${dr.executingPerson}',
                recorded_data = '${dr.recordedData}'
            where id = '${dr.dataRecordingUid}'
            `;
            logger.info(cmd);
            await pool.query(cmd);

            await this.createQuestionnaireIfNotExisits(dr);
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

        logger.info(searchSql);
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

            logger.info(searchSql);
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
        if (searchRequest.filter === undefined || searchRequest.filter == null) {
            searchRequest.filter = {} as VdrModels.VisitFilter;
        }

        const filterClause: string = SearchFilterService.buildVisitFilterSqlClause(
            searchRequest.filter,
            minTimestampUtc,
            'v'
        );

        let searchSql = `SELECT
                id AS "visitUid",
                study_uid AS "studyUid",
                site_uid AS "siteUid",
                subject_identifier AS "subjectIfentifier",
                0 AS "isArchived",
                0 AS modiciationTimestampUtc
                FROM visits v ${filterClause}
                ORDER BY ${VdrMappingHelper.mapVdrPropnameToDbName(sortingField)} ${
            sortDescending ? ' DESC' : ''
        }`;
        if (searchRequest.limitResults !== undefined && searchRequest.limitResults > 0) {
            searchSql += ` LIMIT ${searchRequest.limitResults}`;
        }
        return searchSql;
    }

    private GetSearchVisitsSql_QuestionnaireHistory(
        searchRequest: VdrDtos.SearchVisitsRequest,
        sortingField: string,
        sortDescending: boolean,
        minTimestampUtc: number
    ) {
        if (searchRequest.limitResults < 1) searchRequest.limitResults = 10000;
        if (searchRequest.filter === undefined || searchRequest.filter == null) {
            searchRequest.filter = {} as VdrModels.VisitFilter;
        }

        const filterClause: string =
            SearchFilterService.buildVisitFilterSqlClause_QuestionnaireHistory(
                searchRequest.filter,
                minTimestampUtc,
                'v'
            );

        const studyUid = OrscfAuthConfig.getStudyUid();
        let searchSql = `SELECT
                instance_id AS "visitUid",
                '${studyUid}' studyUid,
                '00000000-0000-0000-0000-000000000000' siteUid,
                subject_id AS "subjectIfentifier",
                0 AS "isArchived",
                extract(epoch from date_received) AS modiciationTimestampUtc
                FROM questionnairehistory v ${filterClause}
                ORDER BY ${VdrMappingHelper.mapVdrPropnameToDbName(sortingField)} ${
            sortDescending ? ' DESC' : ''
        }`;
        if (searchRequest.limitResults !== undefined && searchRequest.limitResults > 0) {
            searchSql += ` LIMIT ${searchRequest.limitResults}`;
        }
        return searchSql;
    }

    public async getVisits(visitUids: string[]): Promise<VdrModels.VisitFields[]> {
        try {
            const pool: Pool = DB.getPool();
            let visitUidsIn = '';
            let i = 0;
            visitUids.forEach((visitUid: string) => {
                visitUidsIn += `'${visitUid}'`;
                if (i < visitUids.length - 1) {
                    visitUidsIn += ',';
                }
                i += 1;
            });

            const cmd = `SELECT
                id visitUid
                ,study_uid studyUid
                ,site_uid siteUid
                ,subject_identifier subjectIdentifier
                ,modification_timestamp_utc modificationTimestampUtc
                ,visit_procedure_name visitProcedureName
                ,visit_execution_title visitExecutionTitle
                ,scheduled_date_utc scheduleDateUtc
                ,execution_date_utc executionDateUtc
                ,execution_state executionState
                ,execution_person executingPerson
            FROM visits where id in (${visitUidsIn}) \
            `;

            logger.info(cmd);
            const getVisitsQuery = await pool.query(cmd);
            return getVisitsQuery.rows.map((x) => {
                return VdrMappingHelper.toCamelCase(x);
            });
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
            let visitUidsIn = '';
            let i = 0;
            visitUids.forEach((visitUid: string) => {
                visitUidsIn += `'${visitUid}'`;
                if (i < visitUids.length - 1) {
                    visitUidsIn += ',';
                }
                i += 1;
            });

            const studyUid = OrscfAuthConfig.getStudyUid();
            const cmd = `
SELECT
          instance_id visitUid
         ,'${studyUid}' studyUid
         ,'00000000-0000-0000-0000-000000000000' siteUid
         ,subject_id subjectIdentifier
         ,extract(epoch from date_received) modificationTimestampUtc
         ,questionnaire_id visitProcedureName
         ,questionnaire_id visitExecutionTitle
         ,date_sent scheduleDateUtc
         ,date_sent executionDateUtc
         ,2 executionState
         ,'(participant)' executingPerson
         ,0 AS "isArchived"
     FROM questionnairehistory
     WHERE date_sent is not null and
           instance_id in (${visitUidsIn})
UNION
SELECT
          questionnairehistory.instance_id visitUid
         ,'${studyUid}' studyUid
         ,'00000000-0000-0000-0000-000000000000' siteUid
         ,questionnairehistory.subject_id subjectIdentifier
         ,extract(epoch from date_received) modificationTimestampUtc
         ,questionnairehistory.questionnaire_id visitProcedureName
         ,questionnairehistory.questionnaire_id visitExecutionTitle
         ,studyparticipant.due_date scheduleDateUtc
         ,questionnairehistory.date_sent executionDateUtc
         ,1 executionState
         ,'(participant)' executingPerson
         ,0 AS "isArchived"
     FROM questionnairehistory, studyparticipant
     WHERE questionnairehistory.subject_id=studyparticipant.subject_id and
           date_sent is null and
           instance_id in (${visitUidsIn})
ORDER BY scheduleDateUtc
            `;

            logger.info(cmd);
            const getVisitsQuery = await pool.query(cmd);
            return getVisitsQuery.rows.map((x) => {
                return VdrMappingHelper.toCamelCase(x);
            });
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }

    public async getDataRecordings(visitUid: string): Promise<VdrModels.DataRecordingStructure[]> {
        try {
            const pool: Pool = DB.getPool();

            const cmd = `SELECT
                id dataRecordingUid
                ,visit_id visitUid
                ,modification_timestamp_utc modificationTimestampUtc
                ,data_recording_name dataRecordingName
                ,task_execution_title taskExecutionTitle
                ,scheduled_date_utc scheduleDateUtc
                ,execution_date_utc executionDateUtc
                ,execution_state executionState
                ,data_scheme_url dataSchemaUrl
                ,notes_regarding_outcome notesRegardingOutcome
                ,execution_person executingPerson
                ,recorded_data recordedData
            FROM datarecordings where visit_id = '${visitUid}' \
            `;

            logger.info(cmd);
            const getDataRecordingsQuery = await pool.query(cmd);
            return getDataRecordingsQuery.rows.map((x) => {
                return VdrMappingHelper.drToCamelCase(x);
            });
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }
}
