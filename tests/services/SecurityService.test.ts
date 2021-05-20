import * as dotenv from 'dotenv';

import { SecurityService } from '../../src/services/SecurityService';

describe('signing', () => {
    dotenv.config({ path: './.env' });

    // disable console output of the PerformanceLogger
    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'log').mockImplementation(() => jest.fn());
    });

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
