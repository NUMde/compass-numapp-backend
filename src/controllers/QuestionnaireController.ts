/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Response } from 'express';

import { Controller, Get, Middleware } from '@overnightjs/core';
import { ISecureRequest } from '@overnightjs/jwt';

import { QuestionnaireModel } from '../models/QuestionnaireModel';
import { AuthorizationController } from './AuthorizationController';

/**
 * Endpoint class for all questionnaire related restful methods.
 *
 * @export
 * @class QuestionnaireController
 */
@Controller('questionnaire')
export class QuestionnaireController {
    private questionnaireModel: QuestionnaireModel = new QuestionnaireModel();

    /**
     * Provide the questionnaire data for the requested questionnaire ID.
     *
     * @param {ISecureRequest} req
     * @param {Response} res
     * @memberof QuestionnaireController
     */
    @Get(':questionnaireId')
    @Middleware([AuthorizationController.checkStudyParticipantLogin])
    public async getQuestionnaire(req: ISecureRequest, res: Response) {
        const bearerHeader = req.headers.authorization;
        const subjectID: string = bearerHeader
            ? bearerHeader.split(' ')[1]
            : req.payload && req.payload.subject_id
            ? req.payload.subject_id
            : req.params && req.params.subjectID
            ? req.params.subjectID
            : undefined;

        const questionnaireId = req.params.questionnaireId;

        this.questionnaireModel.getQuestionnaire(subjectID, questionnaireId).then(
            (resp) => res.status(200).json(resp),
            (err) => {
                if (err.response) {
                    res.status(err.response.status).end();
                } else {
                    res.status(500).end();
                }
            }
        );
    }
}
