import { ParticipantEntry } from './../types/ParticipantEntry';
import { Subject } from '../types/sdr/Subject';

export class SdrMappingHelper {
    public static mapSubjectToParticipantEntry(subject: Subject): ParticipantEntry {
        const result: ParticipantEntry = {
            subject_id: subject.subjectIdentifier,
            language_code: '',
            last_action: subject.modificationTimestampUtc,
            current_questionnaire_id: null,
            start_date: subject.periodStart,
            due_date: null,
            current_instance_id: null,
            current_interval: null,
            additional_iterations_left: 0,
            status: subject.status,
            general_study_end_date: null,
            personal_study_end_date: subject.periodEnd,
            subject_uid: subject.subjectUid,
            study_uid: subject.studyUid,
            actual_site_uid: subject.actualSiteUid,
            enrolling_site_uid: subject.enrollingSiteUid,
            actual_site_defined_patient_identifier: subject.actualSiteDefinitionPatientIdentifier
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
