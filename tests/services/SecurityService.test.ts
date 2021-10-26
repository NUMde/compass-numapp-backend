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
        let result: boolean;
        let newSign: string;
        const value = { name: 'KEY', sound: 'VALUE' };
        try {
            newSign = SecurityService.sign({ key: value });
            SecurityService.verifyJWS(newSign);
            result = true;
        } catch (err) {
            result = false;
        }
        expect(result).toBe(true);
    });
});
