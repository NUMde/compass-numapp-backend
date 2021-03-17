import * as dotenv from 'dotenv';

import { SecurityService } from '../../src/services/SecurityService';

describe('signing', () => {
    dotenv.config({ path: './.env' });

    it('signAndVerify', () => {
        const value = { name: 'KEY', sound: 'VALUE' };
        const newSign = SecurityService.sign({ key: value });
        SecurityService.verifyJWS(newSign);
        let result: boolean;
        try {
            SecurityService.verifyJWS(newSign);
            result = true;
        } catch (err) {
            result = false;
        }
        expect(result).toBe(true);
    });
});
