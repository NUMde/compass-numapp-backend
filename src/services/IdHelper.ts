/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { v4 as uuidv4 } from 'uuid';

export class IdHelper {
    /**
     * Create an RFC version 4 (random) UUID.
     */
    public static createID(): string {
        return uuidv4();
    }
}
