import { VdrMappingHelper } from '../services/VdrMappingHelper';
/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Pool } from 'pg';
import logger from 'jet-logger';
import { DB } from '../server/DB';
import * as VdrModels from 'orscf-visitdata-contract';

export class VisitModel2 {
    public async getDataRecordingsForParticipant(
        subjectIdentifier: string
    ): Promise<VdrModels.DataRecordingStructure[]> {
        try {
            const pool: Pool = DB.getPool();

            const cmd = `SELECT
                 dr.id dataRecordingUid
                ,dr.visit_id visitUid
                ,dr.modification_timestamp_utc modificationTimestampUtc
                ,dr.data_recording_name dataRecordingName
                ,dr.task_execution_title taskExecutionTitle
                ,dr.scheduled_date_utc scheduleDateUtc
                ,dr.execution_date_utc executionDateUtc
                ,dr.execution_state executionState
                ,dr.data_scheme_url dataSchemaUrl
                ,dr.notes_regarding_outcome notesRegardingOutcome
                ,dr.execution_person executingPerson
                ,dr.recorded_data recordedData
            FROM datarecordings dr inner join visits v on v.Id = dr.visit_id where v.subject_identifier = '${subjectIdentifier}' \
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
