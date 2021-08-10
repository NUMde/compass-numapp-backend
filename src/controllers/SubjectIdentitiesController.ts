import { Post } from '@overnightjs/core';
/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Response } from 'express';

import { Controller, Middleware } from '@overnightjs/core';
import { ISecureRequest } from '@overnightjs/jwt';
import { Logger } from '@overnightjs/logger';

import { SubjectIdentitiesModel } from '../models/SubjectIdentitiesModel';
import { AuthorizationController } from './AuthorizationController';

/**
 *  Endpoint class for all subjectId management related restful methods.
 *
 * @export
 * @class SubjectIdentitiesController
 */
@Controller('subjectIdentities')
export class SubjectIdentitiesController {
    private subjectIdentityModel: SubjectIdentitiesModel = new SubjectIdentitiesModel();

    /**
     * Add new subject.
     * Is called by API user to register a new subject which will then get access to app by their id.
     */
    @Post('addNew')
    @Middleware([AuthorizationController.checkApiUserLogin])
    public async addSubjectIdentity(req: ISecureRequest, resp: Response) {
        try {
            // validate parameter existance
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
