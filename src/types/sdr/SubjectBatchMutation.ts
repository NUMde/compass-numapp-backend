export interface SubjectBatchMutation {
    status: string;
    assignedArm: string;
    actualArm: string;
    periodStart: Date;
    periodEnd: Date;
    customFields: string;
}
