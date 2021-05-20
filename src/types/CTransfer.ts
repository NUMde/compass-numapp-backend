/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/**
 * Data class for the export functionality.
 */
export interface CTransfer {
    UUID: string;
    SubjectId: string;
    JSON: string;
    AbsendeDatum: Date;
    ErhaltenDatum: Date;
}
