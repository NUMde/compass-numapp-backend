/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Response } from 'express';

import { Controller, Get, Middleware } from '@overnightjs/core';
import { ISecureRequest } from '@overnightjs/jwt';
import { Logger } from '@overnightjs/logger';

import { UserEntry } from '../types/UserEntry';
import { COMPASSConfig } from '../config/COMPASSConfig';
import { PushServiceConfig } from '../config/PushServiceConfig';
import { UserModel } from '../models/UserModel';
import { AuthorizationController } from './AuthorizationController';

/**
 *  Endpoint class for all user related restful methods.
 *
 * @export
 * @class UserController
 */
@Controller('user')
export class UserController {
    private userModel: UserModel = new UserModel();

    /**
     * Retrieve the current users data.
     * Is called from the client during first login and also during refreh.
     *
     * @param {ISecureRequest} req
     * @param {Response} resp
     * @return {*}
     * @memberof UserController
     */
    @Get(':studyID')
    @Middleware([AuthorizationController.checkStudyUserLogin])
    public async getUser(req: ISecureRequest, resp: Response) {
        try {
            const user: UserEntry = await this.userModel.getAndUpdateUserByStudyID(
                req.params.studyID
            );
            this.userModel.updateLastAction(req.params.studyID);

            const returnObject = {
                current_instance_id: user.current_instance_id,
                current_questionnaire_id: user.current_questionnaire_id,
                due_date: user.due_date,
                start_date: user.start_date,
                study_id: user.study_id,
                firstTime:
                    user.current_questionnaire_id === COMPASSConfig.getInitialQuestionnaireId(),
                additional_iterations_left: user.additional_iterations_left,
                current_interval: user.current_interval,
                pushClientSecret: PushServiceConfig.getClientSecret(),
                pushAppGUID: PushServiceConfig.getAppId(),
                recipient_certificate_pem_string: COMPASSConfig.getRecipientCertificate()
            };
            return resp.status(200).json(returnObject);
        } catch (err) {
            Logger.Err(err, true);
            return resp.sendStatus(500);
        }
    }
}
