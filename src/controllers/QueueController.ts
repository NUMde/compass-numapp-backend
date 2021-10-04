/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Request, Response } from 'express';

import { Controller, Middleware, Post } from '@overnightjs/core';

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
     * 1. A questionnaire is sent
     * 2. A positive result is reported
     * 3. Symptoms are reported
     *
     * @param {Request} req
     * @param {Response} res
     * @memberof QueueController
     */
    @Post()
    @Middleware(AuthorizationController.checkStudyParticipantLogin)
    public async addToQueue(req: Request, res: Response) {
        const queueEntry: QueueEntry = {
            id: null,
            subject_id: req.query.subjectId.toString(),
            encrypted_resp: req.body.payload,
            date_sent: new Date(),
            date_received: this.generateDateReceived(req)
        };
        try {
            const result = await this.queueModel.addDataToQueue(queueEntry, req);
            if (!result) {
                //Data already sent through the other App
                res.status(406).end();
            } else {
                res.status(200).end();
            }
        } catch (err) {
            if (err.response) {
                res.status(err.response.status).end();
            } else {
                res.status(500).end();
            }
        }
    }

    private generateDateReceived(req: Request) {
        const date = new Date();
        if (req.query.type !== COMPASSConfig.getQuestionnaireResponseType()) {
            date.setDate(date.getDate() - 2);
        }
        return date;
    }
}
