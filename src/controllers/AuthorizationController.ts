/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { Controller, Post } from '@overnightjs/core';
import { ISecureRequest } from '@overnightjs/jwt';
import { Logger } from '@overnightjs/logger';

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
        req: ISecureRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const bearerHeader = req.headers.authorization;
            const subjectID: string = bearerHeader
                ? bearerHeader.split(' ')[1]
                : req.payload && req.payload.subject_id
                ? req.payload.subject_id
                : req.params && req.params.subjectID
                ? req.params.subjectID
                : undefined;

            const checkLoginSuccess: boolean = await AuthorizationController.participantModel.checkLogin(
                subjectID
            );

            return checkLoginSuccess ? next() : res.status(401).send();
        } catch (err) {
            Logger.Err(err);
            return res.status(500).send();
        }
    }

    /**
     * Express middleware that checks if the subject ID is valid.
     * This is only used in QuestionnaireController to get a questionnaire by url and version.
     */
    public static async checkSubjectId(req: ISecureRequest, res: Response, next: NextFunction) {
        try {
            const subjectID: string = req.query.subjectId
                ? req.query.subjectId.toString().trimEnd()
                : null;

            if (subjectID) {
                const checkSubjectId: boolean = await AuthorizationController.participantModel.checkLogin(
                    subjectID
                );
                return checkSubjectId ? next() : res.status(401).send();
            } else {
                return next();
            }
        } catch (err) {
            Logger.Err(err);
            return res.status(500).send();
        }
    }
    /**
     * Express middleware that checks if the API user's access token is valid.
     */
    public static async checkApiUserLogin(req: Request, res: Response, next: NextFunction) {
        try {
            AuthConfig.getMiddleware()(req, res, async () => {
                const securedReq = req as ISecureRequest;
                if (securedReq.payload == null || typeof securedReq.payload.api_id !== 'string') {
                    return res.status(401).send();
                }

                const apiId: string = securedReq.payload.api_id;
                const loginSuccess = await AuthorizationController.apiUserModel.checkIfExists(
                    apiId
                );

                return loginSuccess ? next() : res.status(401).send();
            });
        } catch (err) {
            Logger.Err(err);
            return res.status(500).send();
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
            return res.status(401).send();
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
                return res.status(401).send();
            }

            const credsDate = new Date(credentials.CurrentDate);

            if (AuthConfig.getEnableTimeCheckForAPIAuth()) {
                if (credsDate < timeMinus2Mins || credsDate > timePlus2Mins) {
                    return res.status(401).send();
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
                const accessToken = AuthConfig.getJwtManager().jwt({
                    api_id: apiUser.api_id
                });

                return res.json({
                    access_token: accessToken
                });
            } else {
                return res.status(401).send();
            }
        } catch (err) {
            Logger.Err(err);
            return res.status(401).send();
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
                return res.sendStatus(400);
            }

            const password = req.body.password;
            const result = SecurityService.createPasswordHash(password);
            return res.send(result);
        } catch (err) {
            return res.sendStatus(500);
        }
    }
}
