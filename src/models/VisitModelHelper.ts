import { Pool } from 'pg';
import format from 'pg-format';
import logger from 'jet-logger';
import { DB } from '../server/DB';
import * as VdrModels from 'orscf-visitdata-contract';

export class VisitModelHelper {
    public static async getDataRecordingsForParticipant(
        subjectIdentifier: string
    ): Promise<VdrModels.DataRecordingStructure[]> {
        try {
            const pool: Pool = DB.getPool();

            const getDataRecordingsQuery = await pool.query(
                format(
                    `SELECT
                        dr.id "dataRecordingUid",
                        dr.visit_id "visitUid",
                        dr.modification_timestamp_utc "modificationTimestampUtc",
                        dr.data_recording_name "dataRecordingName",
                        dr.task_execution_title "taskExecutionTitle",
                        dr.scheduled_date_utc "scheduleDateUtc",
                        dr.execution_date_utc "executionDateUtc",
                        dr.execution_state "executionState",
                        dr.data_scheme_url "dataSchemaUrl",
                        dr.notes_regarding_outcome "notesRegardingOutcome",
                        dr.execution_person "executingPerson",
                        dr.recorded_data "recordedData"
                    FROM datarecordings dr INNER JOIN visits v on v.Id = dr.visit_id
                    WHERE v.subject_identifier = %L`,
                    subjectIdentifier
                )
            );
            return getDataRecordingsQuery.rows;
        } catch (err) {
            logger.err(err);
            throw err;
        }
    }
}
