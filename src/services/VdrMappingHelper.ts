import { DataRecordingStructure } from 'orscf-visitdata-contract';

export class VdrMappingHelper {
    static drToCamelCase(x): DataRecordingStructure {
        return {
            dataRecordingUid: x.datarecordinguid,
            visitUid: x.visituid,
            modificationTimestampUtc: x.modificationtimestamputc,
            dataRecordingName: x.datarecordingname,
            taskExecutionTitle: x.taskexecutiontitle,
            scheduledDateTimeUtc: x.scheduledateutc,
            executionDateTimeUtc: x.executiondateutc,
            executionState: x.executionstate,
            dataSchemaUrl: x.dataschemaurl,
            notesRegardingOutcome: x.notesregardingoutcome,
            executingPerson: x.executingperson,
            isArchived: false,
            recordedData: x.recordeddata,
            dataSchemaVersion: '',
            dataSchemaKind: ''
        };
    }

    public static mapVdrPropnameToDbName(sdrSubjectPropName: string): string {
        switch (sdrSubjectPropName) {
            case 'studyUid':
                return 'study_uid';
            case 'subjectIdentifier':
                return 'subject_identifier';
            case 'siteUid':
                return 'site_uid';
            case 'visitProcedureName':
                return 'visit_procedure_name';
            case 'visitExecutionTitle':
                return 'visit_execution_title';
            case 'visitUid':
                return 'id';
            default:
                return sdrSubjectPropName;
        }
    }
}
