/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/**
 * Represents an entry in the "apiuser" table.
 */
export interface ApiUserEntry {
    api_id: string;
    api_key: Date;
    api_key_salt: string;
}
