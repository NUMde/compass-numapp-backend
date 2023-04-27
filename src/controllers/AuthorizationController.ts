/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { Controller, Post } from '@overnightjs/core';
import logger from 'jet-logger';
import { Jwt } from 'jsonwebtoken';

import { AuthConfig } from '../config/AuthConfig';
import { ApiUserModel } from '../models/ApiUserModel';
import { ParticipantModel } from '../models/ParticipantModel';
import { SecurityService } from '../services/SecurityService';

const MS_PER_MINUTE = 60000;

/**
 * This class bundles authorization related logic like express middleware functions and rest API methods.
 *
 * @export
 * @class AuthorizationController
 */
@Controller('auth')
export class AuthorizationController {
    private static apiUserModel: ApiUserModel = new ApiUserModel();
    private static participantModel: ParticipantModel = new ParticipantModel();

    /**
     * Express middleware that checks if the subject ID is valid.
     */
    public static async checkStudyParticipantLogin(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const bearerHeader = req.headers.authorization;
            const subjectID: string = bearerHeader
                ? bearerHeader.split(' ')[1]
                : req.params && req.params.subjectID
                ? req.params.subjectID
                : undefined;

            const checkLoginSuccess: boolean =
                await AuthorizationController.participantModel.checkLogin(subjectID);

            return checkLoginSuccess
                ? next()
                : res.status(401).json({
                      errorCode: 'AuthFailed',
                      errorMessage: 'No valid authorization details provided.'
                  });
        } catch (err) {
            logger.err(err);
            return res.status(500).json({
                errorCode: 'InternalErr',
                errorMessage: 'An internal error occurred.',
                errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
            });
        }
    }

    /**
     * Express middleware that checks if the API user's access token is valid.
     */
    public static async checkApiUserLogin(_req: Request, token: Jwt) {
        try {
            const success = await AuthorizationController.apiUserModel.checkIfExists(
                token.payload['api_id']
            );
            if (success) {
                return Promise.resolve(false);
            } else return Promise.resolve(true);
        } catch (err) {
            logger.err(err);
            return Promise.reject();
        }
    }

    /**
     * Login method for an API user
     *
     * @param {Request} req
     * @param {Response} res
     * @return {*}
     * @memberof AuthorizationController
     */
    @Post('')
    public async loginApiUser(req: Request, res: Response) {
        const encryptedCredentials = req.body.encrypted_creds;
        const encryptedKey = req.body.encrypted_key;
        const initializationVector = req.body.iv;

        if (
            typeof encryptedCredentials !== 'string' ||
            typeof encryptedKey !== 'string' ||
            typeof initializationVector !== 'string'
        ) {
            return res.status(401).json({
                errorCode: 'AuthInvalid',
                errorMessage: 'Invalid credentials provided. Only strings allowed.'
            });
        }

        try {
            const decryptedCredentials = SecurityService.decryptLogin(
                encryptedCredentials,
                encryptedKey,
                initializationVector
            );
            const credentials = JSON.parse(decryptedCredentials);
            const timeNow = new Date();
            const timeMinus2Mins = new Date(timeNow.valueOf() - 2 * MS_PER_MINUTE);
            const timePlus2Mins = new Date(timeNow.valueOf() + 2 * MS_PER_MINUTE);

            if (
                typeof credentials.ApiID !== 'string' ||
                typeof credentials.ApiKey !== 'string' ||
                typeof credentials.CurrentDate !== 'string'
            ) {
                return res.status(401).json({
                    errorCode: 'AuthInvalid',
                    errorMessage: 'Invalid credentials provided. Only strings allowed.'
                });
            }

            const credsDate = new Date(credentials.CurrentDate);

            if (AuthConfig.enableTimeCheckForAPIAuth) {
                if (credsDate < timeMinus2Mins || credsDate > timePlus2Mins) {
                    return res.status(401).json({
                        errorCode: 'AuthOutdated',
                        errorMessage: 'Invalid credentials provided. Timestamp is outdated.'
                    });
                }
            }

            const apiUser = await AuthorizationController.apiUserModel.getApiUserByID(
                credentials.ApiID
            );

            const passwordHash = SecurityService.createPasswordHash(
                credentials.ApiKey,
                apiUser.api_key_salt
            );

            const apiKeysMatching = timingSafeEqual(
                Buffer.from(apiUser.api_key),
                Buffer.from(passwordHash.passwordHash)
            );

            if (apiKeysMatching) {
                // create accessToken which is a jwt containing the api_id as payload
                const accessToken = AuthConfig.sign({
                    api_id: apiUser.api_id
                });

                return res.json({
                    access_token: accessToken
                });
            } else {
                return res.status(401).json({
                    errorCode: 'AuthNoMatch',
                    errorMessage: 'Invalid credentials provided: api_key and api_id do not match.'
                });
            }
        } catch (err) {
            logger.err(err);
            return res.status(401).json({
                errorCode: 'AuthError',
                errorMessage:
                    process.env.NODE_ENV !== 'production'
                        ? `Authorization failed with error: '${err.message}'.`
                        : 'Authorization failed.',
                errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
            });
        }
    }

    /**
     * Helper method to create password hashes.
     *
     * @param {Request} req
     * @param {Response} res
     * @return {*}
     * @memberof AuthorizationController
     */
    @Post('helper/passwordhash')
    public async helperCreatePasswordHash(req: Request, res: Response) {
        try {
            if (!req.body || !req.body.password) {
                return res.status(400).json({
                    errorCode: 'InvalidQuery',
                    errorMessage: 'Invalid authorization query.'
                });
            }

            const password = req.body.password;
            const result = SecurityService.createPasswordHash(password);
            return res.json(result);
        } catch (err) {
            return res.status(500).json({
                errorCode: 'InternalErr',
                errorMessage: 'Request failed due to an internal error.',
                errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
            });
        }
    }
}
