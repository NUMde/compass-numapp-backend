/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Request, Response } from 'express';

import { Post, Controller, ClassMiddleware } from '@overnightjs/core';
import Logger from 'jet-logger';

import { SubjectIdentitiesModel } from '../models/SubjectIdentitiesModel';
import { AuthorizationController } from './AuthorizationController';
import jwt from 'express-jwt';
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
export class SubjectIdentitiesController {
    private subjectIdentityModel: SubjectIdentitiesModel = new SubjectIdentitiesModel();

    /**
     * Add new subject.
     * Is called by API user to register a new subject which will then get access to app by their id.
     */
    @Post('addNew')
    public async addSubjectIdentity(req: Request, resp: Response) {
        try {
            // validate parameter existence
            if (!req.body.subjectIdentity || !req.body.subjectIdentity.recordId) {
                return resp.status(400).send({
                    error: 'missing_data'
                });
            }

            const subjectIdentityExistence: boolean = await this.subjectIdentityModel.getSubjectIdentityExistence(
                req.body.subjectIdentity.recordId
            );

            if (subjectIdentityExistence) {
                return resp.status(409).send({
                    error: 'participant_already_exists'
                });
            }

            await this.subjectIdentityModel.addNewSubjectIdentity(
                req.body.subjectIdentity.recordId
            );

            return resp.status(200).json({
                return: true
            });
        } catch (err) {
            Logger.Err(err, true);
            return resp.sendStatus(500);
        }
    }
}
