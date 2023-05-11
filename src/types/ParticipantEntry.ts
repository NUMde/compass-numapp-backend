/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/**
 * Represents an entry in the "studyparticipant" table.
 */
export enum ParticipationStatus {
    OnStudy = 'on-study',
    OffStudy = 'off-study'
}
export interface ParticipantEntry {
    subject_id: string;
    last_action: Date;
    current_questionnaire_id: string;
    start_date: Date;
    due_date: Date;
    current_instance_id: string;
    current_interval: number;
    additional_iterations_left: number;
    status: ParticipationStatus;
    general_study_end_date: Date;
    personal_study_end_date: Date;
    language_code: string;
    // orscf - sdr
    subject_uid: string | null;
    study_uid: string | null;
    actual_site_uid: string | null;
    enrolling_site_uid: string | null;
    actual_site_defined_patient_identifier: string | null;
}
