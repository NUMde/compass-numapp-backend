/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Response } from 'express';

import { Controller, Middleware, Post } from '@overnightjs/core';
import { ISecureRequest } from '@overnightjs/jwt';

import { QueueEntry } from '../types/QueueEntry';
import { COMPASSConfig } from '../config/COMPASSConfig';
import { QueueModel } from '../models/QueueModel';
import { AuthorizationController } from './AuthorizationController';

/**
 * Endpoint class for all study data queue related restful methods.
 *
 * @export
 * @class QueueController
 */
@Controller('queue')
export class QueueController {
    private queueModel: QueueModel = new QueueModel();

    /**
     * Add entries to the queue. It is called during following events from the client:
     * 1. A questionnair is send
     * 2. A positive result is reported
     * 3. Symptoms are reported
     *
     * @param {ISecureRequest} req
     * @param {Response} res
     * @memberof QueueController
     */
    @Post()
    @Middleware([AuthorizationController.checkStudyUserLogin])
    public async addToQueue(req: ISecureRequest, res: Response) {
        const queueEntry: QueueEntry = {
            id: null,
            study_id: req.query.appId.toString(),
            encrypted_resp: req.body.payload,
            date_sent: new Date(),
            date_received: this.generateDateReceived(req)
        };

        this.queueModel.addDataToQueue(queueEntry, req).then(
            () => res.status(200).end(),
            (err) => {
                if (err.response) {
                    res.status(err.response.status).end();
                } else {
                    res.status(500).end();
                }
            }
        );
    }

    private generateDateReceived(req: ISecureRequest) {
        const date = new Date();
        if (req.query.type !== COMPASSConfig.getQuestionnaireResponseType()) {
            date.setDate(date.getDate() - 2);
        }
        return date;
    }
}
