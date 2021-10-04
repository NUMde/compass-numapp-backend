/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { randomBytes } from 'crypto';
import * as env from 'env-var';

import * as jwtManager from 'jsonwebtoken';

/**
 * Config holder for the authentication logic.
 */
const AuthConfig = {
    // the json webtoken secret which is either read from an environment variable (if set) or randomly generated
    jwtSecret: env.get('JWT_SECRET').default(randomBytes(256).toString('base64')).asString(),

    // Flag to toggle a time check for the API authentication
    enableTimeCheckForAPIAuth: env.get('AUTH_USE_API_TIME_CHECK').default('true').asBoolStrict(),

    //create json webtoken from payload and secret with validity of 30 minutes
    sign: (payload: Record<string, unknown>): string => {
        return jwtManager.sign(payload, AuthConfig.jwtSecret, {
            algorithm: 'HS256',
            expiresIn: '30m'
        });
    }
};

export { AuthConfig };
