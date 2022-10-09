import { DataRecordingStructure } from 'orscf-visitdata-contract';
import { VisitFields } from 'orscf-visitdata-contract';

export class VdrMappingHelper {
    static drToCamelCase(x: any): DataRecordingStructure {
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

    static toCamelCase(x: any): VisitFields {
        return {
            visitUid: x.visituid,
            isArchived: false,
            studyUid: x.studyuid,
            siteUid: x.siteuid,
            subjectIdentifier: x.subjectidentifier,
            modificationTimestampUtc: x.modificationzimestamputc,
            visitProcedureName: x.visitprocedurename,
            visitExecutionTitle: x.visitexecutiontitle,
            scheduledDateUtc: x.scheduledateutc,
            executionDateUtc: x.executiondateutc,
            executionState: x.executionstate,
            executingPerson: x.executingperson
        };
    }
    public static mapVdrPropnameToDbName(sdrSubjectPropName: string): string {
        switch (sdrSubjectPropName) {
            case 'studyUid':
                return 'study_uid';
                break;
            case 'subjectIdentifier':
                return 'subject_identifier';
                break;
            case 'siteUid':
                return 'site_uid';
                break;
            case 'visitProcedureName':
                return 'visit_procedure_name';
                break;
            case 'visitExecutionTitle':
                return 'visit_execution_title';
                break;
            case 'visitUid':
                return 'id';
                break;
            default:
                return sdrSubjectPropName;
                break;
        }
    }
}
