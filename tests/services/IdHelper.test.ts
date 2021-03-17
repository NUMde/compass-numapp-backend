import { validate } from 'uuid';

import { IdHelper } from '../../src/services/IdHelper';

describe('IdHelper', () => {
    it('createId', () => {
        const uuid = IdHelper.createID();
        expect(validate(uuid)).toBe(true);
    });
});
