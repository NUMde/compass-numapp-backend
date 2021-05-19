/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/**
 * Represents an entry in the "studyparticipant" table.
 */
export interface ParticipantEntry {
    subject_id: string;
    last_action: Date;
    current_questionnaire_id: string;
    start_date: Date;
    due_date: Date;
    current_instance_id: string;
    current_interval: number;
    additional_iterations_left: number;
}
