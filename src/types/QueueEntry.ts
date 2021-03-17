/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/**
 * Represents an entry in the queue table.
 */
export interface QueueEntry {
    id: string;
    study_id: string;
    encrypted_resp: string;
    date_sent: Date;
    date_received: Date;
}
