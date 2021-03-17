/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { randomBytes } from 'crypto';
import * as env from 'env-var';
import { RequestHandler } from 'express';

import { JwtManager } from '@overnightjs/jwt';

/**
 * Config holder for the authentication logic.
 */
export class AuthConfig {
    private static jwtManager: JwtManager | undefined;

    private static getJwtSecret(): string {
        return env.get('JWT_SECRET').default(randomBytes(256).toString('base64')).asString();
    }

    /**
     * Flag to enable/disable a time check for the API authentication.
     *
     * @return {*}  {boolean} Defaults to true, if not changed in environment.
     * @memberof AuthConfig
     */
    public static getEnableTimeCheckForAPIAuth(): boolean {
        return env.get('AUTH_USE_API_TIME_CHECK').default('true').asBoolStrict();
    }

    /**
     * Expose the middleware from the JwtManager.
     * It handles JWT header and extracts data from token into the payload object from request.
     *
     * @static
     * @return {*}  {RequestHandler}
     * @memberof AuthConfig
     */
    public static getMiddleware(): RequestHandler {
        if (AuthConfig.jwtManager === undefined) {
            AuthConfig.jwtManager = new JwtManager(AuthConfig.getJwtSecret(), '30m');
        }
        return AuthConfig.jwtManager.middleware;
    }

    /**
     * Expose the JwtManger.
     *
     * @static
     * @return {*}  {JwtManager}
     * @memberof AuthConfig
     */
    public static getJwtManager(): JwtManager {
        if (AuthConfig.jwtManager === undefined) {
            AuthConfig.jwtManager = new JwtManager(AuthConfig.getJwtSecret(), '30m');
        }
        return AuthConfig.jwtManager;
    }
}
