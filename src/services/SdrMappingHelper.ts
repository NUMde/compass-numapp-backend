import { COMPASSConfig } from '../config/COMPASSConfig';
import { ParticipantEntry, ParticipationStatus } from './../types/ParticipantEntry';
import * as SdrModels from 'orscf-subjectdata-contract';

export class SdrMappingHelper {
    public static mapParticipantEntryToSubject(
        participantEntry: ParticipantEntry
    ): SdrModels.SubjectFields {
        const result: SdrModels.SubjectFields = {
            subjectIdentifier: participantEntry.subject_id,
            modificationTimestampUtc: Math.round(participantEntry.last_action.getTime() / 1000),
            periodStart: participantEntry.start_date,
            status: participantEntry.status,
            periodEnd: participantEntry.personal_study_end_date,
            subjectUid: participantEntry.subject_uid,
            studyUid: participantEntry.study_uid,
            actualSiteUid: participantEntry.actual_site_uid,
            enrollingSiteUid: participantEntry.enrolling_site_uid,
            actualSiteDefinedPatientIdentifier:
                participantEntry.actual_site_defined_patient_identifier,
            isArchived: false,
            statusNote: ''
        };
        return result;
    }

    public static enumFromStringValue<T>(enm: { [s: string]: T }, value: string): T | undefined {
        return (Object.values(enm) as unknown as string[]).includes(value)
            ? (value as unknown as T)
            : undefined;
    }

    public static mapSubjectToParticipantEntry(subject: SdrModels.SubjectFields): ParticipantEntry {
        const result: ParticipantEntry = {
            subject_id: subject.subjectIdentifier,
            language_code: COMPASSConfig.getDefaultLanguageCode(),
            last_action: new Date(subject.modificationTimestampUtc),
            current_questionnaire_id: null,
            start_date: subject.periodStart,
            due_date: subject.periodStart,
            current_instance_id: null,
            current_interval: null,
            additional_iterations_left: 0,
            status: SdrMappingHelper.enumFromStringValue(ParticipationStatus, subject.status),
            general_study_end_date: subject.periodEnd,
            personal_study_end_date: subject.periodEnd,
            subject_uid: subject.subjectUid,
            study_uid: subject.studyUid,
            actual_site_uid: subject.actualSiteUid,
            enrolling_site_uid: subject.enrollingSiteUid,
            actual_site_defined_patient_identifier: subject.actualSiteDefinedPatientIdentifier
        };
        return result;
    }

    public static mapSdrSubjectPropnameToParticipantPropName(sdrSubjectPropName: string): string {
        switch (sdrSubjectPropName) {
            case 'subjectIdentifier':
                return 'subject_id';
                break;
            case 'modificationTimestampUtc':
                return 'last_action';
                break;
            case 'periodStart':
                return 'start_date';
                break;
            case 'periodEnd':
                return 'personal_study_end_date';
                break;
            case 'studyUid':
                return 'study_uid';
                break;
            case 'subjectUid':
                return 'subject_uid';
                break;
            case 'actualSiteUid':
                return 'actual_site_uid';
                break;
            case 'enrollingSiteUid':
                return 'enrolling_site_uid';
                break;
            case 'actualSiteDefinitionPatientIdentifier':
                return 'actual_site_defined_patient_identifier';
                break;
            default:
                return sdrSubjectPropName;
                break;
        }
    }
}
