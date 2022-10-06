/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Request, Response } from 'express';

import { Controller, Middleware, Post } from '@overnightjs/core';

import { QueueEntry } from '../types/QueueEntry';
import { COMPASSConfig } from '../config/COMPASSConfig';
import { QueueModel } from '../models/QueueModel';
import { ParticipantModel } from '../models/ParticipantModel';
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
    private participantModel = new ParticipantModel();

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
            questionnaire_id: req.query.surveyId ? req.query.surveyId.toString() : 'Special_Report',
            encrypted_resp: req.body.payload,
            date_sent: new Date(),
            date_received: this.generateDateReceived(req)
        };
        try {
            const result = await this.queueModel.addDataToQueue(queueEntry, req);
            if (!result) {
                //Data already sent through the other App
                res.status(409).json({
                    errorCode: 'QueueDuplicateRes',
                    errcode:
                        'Queue already contains response object for the corresponding questionnaire.'
                });
            } else {
                const newUserData = await this.participantModel.getAndUpdateParticipantBySubjectID(
                    req.query.subjectId.toString()
                );
                return res.status(200).json(newUserData);
            }
        } catch (err) {
            if (err.response) {
                res.status(err.response.status).send();
            } else {
                res.status(500).json({
                    errorCode: 'InternalErr',
                    errMessage: 'An internal error occurred.',
                    errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
                });
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
