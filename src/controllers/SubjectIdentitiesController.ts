/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Request, Response } from 'express';

import { Post, Controller, ClassMiddleware, ClassErrorMiddleware } from '@overnightjs/core';
import logger from 'jet-logger';

import { SubjectIdentitiesModel } from '../models/SubjectIdentitiesModel';
import { AuthorizationController } from './AuthorizationController';
import { expressjwt as jwt } from 'express-jwt';
import { AuthConfig } from '../config/AuthConfig';

/**
 *  Endpoint class for all subjectId management related restful methods.
 *
 * @export
 * @class SubjectIdentitiesController
 */
@Controller('subjectIdentities')
@ClassMiddleware(
    jwt({
        secret: AuthConfig.jwtSecret,
        algorithms: ['HS256'],
        requestProperty: 'payload',
        isRevoked: AuthorizationController.checkApiUserLogin
    })
)
@ClassErrorMiddleware((err, _req, res, next) => {
    res.status(err.status).json({
        errorCode: err.code,
        errorMessage: err.inner.message,
        errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
    next(err);
})
export class SubjectIdentitiesController {
    private subjectIdentityModel: SubjectIdentitiesModel = new SubjectIdentitiesModel();

    /**
     * Add new subject.
     * Is called by API user to register a new subject which will then get access to app by their id.
     */
    @Post('addNew')
    public async addSubjectIdentity(req: Request, res: Response) {
        try {
            // validate parameter existence
            if (!req.body.subjectIdentity || !req.body.subjectIdentity.recordId) {
                return res.status(400).send({
                    error: 'missing_data'
                });
            }

            const subjectIdentityExistence: boolean =
                await this.subjectIdentityModel.getSubjectIdentityExistence(
                    req.body.subjectIdentity.recordId
                );

            if (subjectIdentityExistence) {
                return res.status(409).send({
                    error: 'participant_already_exists'
                });
            }

            await this.subjectIdentityModel.addNewSubjectIdentity(
                req.body.subjectIdentity.recordId
            );

            return res.status(200).json({
                return: true
            });
        } catch (err) {
            logger.err(err, true);
            return res.status(500).json({
                errorCode: 'InternalErr',
                errorMessage: 'An internal error ocurred.',
                errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
            });
        }
    }
}
