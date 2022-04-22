import { ParticipationStatus } from './../ParticipantEntry';
/**
 * Represents an entry in the "apiuser" table.
 */
export interface Subject {
    subjectUid: string;
    subjectIdentifier: string;
    studyUid: string;
    actualSiteUid: string;
    isArchived: true;
    modificationTimestampUtc: Date;
    enrollingSiteUid: string;
    status: ParticipationStatus;
    statusNote: string;
    periodStart: Date;
    periodEnd: Date;
    assignedArm: Date;
    actualArm: Date;
    substudyNames: string[];
    actualSiteDefinitionPatientIdentifier: string;
    customFields: string;
}
