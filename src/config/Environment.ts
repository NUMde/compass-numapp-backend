/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import * as env from 'env-var';

/**
 * Environment related configuration.
 *
 * @export
 * @class Environment
 */
export class Environment {
    /**
     * Get the port for the express server.
     *
     * @static
     * @return {*}  {number}
     * @memberof Environment
     */
    public static getPort(): number {
        return env.get('PORT').default(8080).asPortNumber();
    }

    /**
     * Determine if we are in development/local mode.
     *
     * @static
     * @return {*}  {boolean}
     * @memberof Environment
     */
    public static isLocal(): boolean {
        return Environment.getStage() === 'development';
    }

    /**
     * Determine if we are in production mode.
     *
     * @static
     * @return {*}  {boolean}
     * @memberof Environment
     */
    public static isProd(): boolean {
        return Environment.getStage() === 'production';
    }

    private static getStage(): string {
        return env.get('NODE_ENV').default('development').asString();
    }
}
