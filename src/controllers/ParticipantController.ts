/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Request, Response } from 'express';
import { Controller, Get, Post, Middleware } from '@overnightjs/core';
import logger from 'jet-logger';

import { ParticipantEntry } from '../types/ParticipantEntry';
import { COMPASSConfig } from '../config/COMPASSConfig';
import { ParticipantModel } from '../models/ParticipantModel';
import { AuthorizationController } from './AuthorizationController';

/**
 *  Endpoint class for all participant related restful methods.
 *
 * @export
 * @class ParticipantController
 */
@Controller('participant')
export class ParticipantController {
    private participantModel: ParticipantModel = new ParticipantModel();

    /**
     * Retrieve the current subject data.
     * Is called from the client during first login and also during refresh.
     */
    @Get(':subjectID')
    @Middleware([AuthorizationController.checkStudyParticipantLogin])
    public async getParticipant(req: Request, res: Response) {
        try {
            const participant: ParticipantEntry =
                await this.participantModel.getAndUpdateParticipantBySubjectID(
                    req.params.subjectID
                );
            this.participantModel.updateLastAction(req.params.subjectID);

            const returnObject = {
                current_instance_id: participant.current_instance_id,
                current_questionnaire_id: participant.current_questionnaire_id,
                due_date: participant.due_date,
                start_date: participant.start_date,
                subjectId: participant.subject_id,
                firstTime:
                    participant.current_questionnaire_id ===
                    COMPASSConfig.getInitialQuestionnaireId(),
                additional_iterations_left: participant.additional_iterations_left,
                current_interval: participant.current_interval,
                recipient_certificate_pem_string: COMPASSConfig.getRecipientCertificate(),
                status: participant.status,
                general_study_end_date: participant.general_study_end_date,
                personal_study_end_date: participant.personal_study_end_date,
                language_code: participant.language_code
            };
            return res.status(200).json(returnObject);
        } catch (err) {
            logger.err(err, true);
            return res.status(500).json({
                errorCode: 'InternalErr',
                errorMessage: 'An internal error ocurred.',
                errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
            });
        }
    }

    /**
     * Updates the device registration token that is used for the Firebase cloud messaging service.
     * Is called from the client, when the token is changed on the device.
     */
    @Post('update-device-token/:subjectID')
    @Middleware([AuthorizationController.checkStudyParticipantLogin])
    public async updateDeviceTokenForParticipant(req: Request, res: Response) {
        try {
            // validate parameter
            if (!req.params.subjectID || !req.body.token) {
                return res.status(400).send({
                    errorCode: 'InvalidQuery',
                    errorMessage: 'Invalid credentials: missing subject_id or token'
                });
            }
            await this.participantModel.updateDeviceToken(
                req.params.subjectID,
                req.body.token.toString()
            );

            return res.sendStatus(204);
        } catch (err) {
            logger.err(err, true);
            return res.status(500).json({
                errorCode: 'InternalErr',
                errorMessage: 'An internal error ocurred.',
                errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
            });
        }
    }

    /**
     * Updates the language preference of a participant.
     * Is called from the client during first login and when the language is changed.
     */
    @Post('update-language-code/:subjectID')
    @Middleware([AuthorizationController.checkStudyParticipantLogin])
    public async updateLanguageCodeForParticipant(req: Request, resp: Response) {
        try {
            // validate parameter
            if (!req.params.subjectID || !req.body.language) {
                return resp.status(400).send({ error: 'missing_data' });
            }
            await this.participantModel.updateLanguageCode(req.params.subjectID, req.body.language);

            return resp.sendStatus(204);
        } catch (err) {
            logger.err(err, true);
            return resp.sendStatus(500);
        }
    }
}
