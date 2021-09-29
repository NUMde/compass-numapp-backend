/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Request, Response } from 'express';

import { Controller, Get, Middleware, Post, Put } from '@overnightjs/core';

import { QuestionnaireModel } from '../models/QuestionnaireModel';
import { AuthorizationController } from './AuthorizationController';
import jwt from 'express-jwt';
import { AuthConfig } from '../config/AuthConfig';

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
     * @param {Request} req
     * @param {Response} res
     * @memberof QuestionnaireController
     */
    @Get(':questionnaireId')
    @Middleware([AuthorizationController.checkStudyParticipantLogin])
    public async getQuestionnaire(req: Request, res: Response) {
        const bearerHeader = req.headers.authorization;
        const subjectID: string = bearerHeader
            ? bearerHeader.split(' ')[1]
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

    /**
     * Add a questionnaire.
     *
     * @param {Request} req
     * @param {Response} res
     * @memberof QuestionnaireController
     */
    @Post('')
    @Middleware(
        jwt({
            secret: AuthConfig.jwtSecret,
            algorithms: ['HS256'],
            requestProperty: 'payload',
            isRevoked: AuthorizationController.checkApiUserLogin
        })
    )
    public async addQuestionnaire(req: Request, res: Response) {
        const url = req.body.url;
        const version = req.body.version;
        const name = req.body.name;
        const questionnaire = req.body.questionnaire;

        this.questionnaireModel.addQuestionnaire(url, version, name, questionnaire).then(
            () => {
                res.status(200).send();
            },
            (err) => {
                if (err.code === '409') {
                    res.status(409).send('A questionnaire with this name already exists.');
                } else {
                    res.status(500).send();
                }
            }
        );
    }

    /**
     * Update a questionnaire.
     *
     * @param {Request} req
     * @param {Response} res
     * @memberof QuestionnaireController
     */
    @Put('')
    @Middleware(
        jwt({
            secret: AuthConfig.jwtSecret,
            algorithms: ['HS256'],
            requestProperty: 'payload',
            isRevoked: AuthorizationController.checkApiUserLogin
        })
    )
    public async updateQuestionnaire(req: Request, res: Response) {
        const url = req.body.url;
        const version = req.body.version;
        const name = req.body.name;
        const questionnaire = req.body.questionnaire;

        this.questionnaireModel.updateQuestionnaire(url, version, name, questionnaire).then(
            () => {
                res.status(200).send();
            },
            (err) => {
                if (err.code === 409) {
                    res.status(409).send(
                        'A questionnaire with this url and version already exists.'
                    );
                } else if (err.code === 404) {
                    res.status(404).send(
                        'No questionnaire with given url and name found to update'
                    );
                }
                res.status(500).send();
            }
        );
    }
}
