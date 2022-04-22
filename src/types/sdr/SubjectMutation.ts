export interface SubjectMutation {
    status: string;
    assignedArm: string;
    actualArm: string;
    periodStart: Date;
    periodEnd: Date;
    customFields: string;
    statusNote: string;
    substudyNames: string;
    actualSiteDefinedPatientIdentifier: string;
}
