import { ParticipationStatus } from './../ParticipantEntry';
export interface SubjectSearchRequest {
    filter: {
        studyUid: string;
        siteUid: string;
        subjectIdentifier: string;
        status: ParticipationStatus;
        minPeriodStart: Date;
        maxPeriodStart: Date;
        minPeriodEnd: Date;
        maxPeriodEnd: Date;
        assignedArm: string;
        actualArm: string;
        substudyName: string;
        actualSiteDefinedPatientIdentifier: string;
        customFields: string;
    };
    includeArchivedRecords: true;
    limitResults: 0;
}
