/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Request, Response } from 'express';

import { Controller, ClassErrorMiddleware, Get, Middleware, Post, Put } from '@overnightjs/core';

import { QuestionnaireModel } from '../models/QuestionnaireModel';
import { AuthorizationController } from './AuthorizationController';
import { expressjwt as jwt } from 'express-jwt';
import { AuthConfig } from '../config/AuthConfig';
import { COMPASSConfig } from '../config/COMPASSConfig';

/**
 * Endpoint class for all questionnaire related restful methods.
 *
 * @export
 * @class QuestionnaireController
 */
@Controller('questionnaire')
@ClassErrorMiddleware((err, _req, res, next) => {
    res.status(err.status).json({
        errorCode: err.code,
        errorMessage: err.inner.message,
        errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
    next(err);
})
export class QuestionnaireController {
    private questionnaireModel: QuestionnaireModel = new QuestionnaireModel();

    /**
     * Retrieve available questionnaire languages.
     *
     * @param {Request} req
     * @param {Response} res
     * @memberof QuestionnaireController
     */
    @Get('get-languages')
    public async getQuestionnaireLanguages(req: Request, res: Response) {
        this.questionnaireModel.getQuestionnaireLanguages().then(
            (response) => {
                res.status(200).send(response);
            },
            (error) => {
                res.status(500).json({
                    errorCode: 'InternalErr',
                    errorMessage: 'An internal error occurred.',
                    errorStack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
                });
            }
        );
    }

    /**
     * Provide the questionnaire data for the requested questionnaire ID.
     *
     * @param {Request} req
     * @param {Response} res
     * @memberof QuestionnaireController
     */
    @Get(':questionnaireId/:language?')
    @Middleware([AuthorizationController.checkStudyParticipantLogin])
    public async getQuestionnaire(req: Request, res: Response) {
        const bearerHeader = req.headers.authorization;
        const subjectID: string = bearerHeader
            ? bearerHeader.split(' ')[1]
            : req.params && req.params.subjectID
            ? req.params.subjectID
            : undefined;

        const questionnaireId = req.params.questionnaireId;
        const language = req.params.language
            ? req.params.language
            : COMPASSConfig.getDefaultLanguageCode();

        this.questionnaireModel.getQuestionnaire(subjectID, questionnaireId, language).then(
            (resp) => res.status(200).json(resp),
            (err) => {
                if (err.response) {
                    res.status(err.response.status).send();
                } else {
                    res.status(500).json({
                        errorCode: 'InternalErr',
                        errorMessage: 'An internal error occurred.',
                        errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
                    });
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

        if (!(url && version && name && questionnaire)) {
            return res.status(400).json({
                errorCode: 'InvalidQuery',
                errMessage: 'Invalid query: params missing'
            });
        }

        this.questionnaireModel.addQuestionnaire(url, version, name, questionnaire).then(
            () => {
                res.sendStatus(204);
            },
            (err) => {
                if (err.code === 409) {
                    res.status(409).json({
                        errorCode: 'QueueNameDuplicate',
                        errorMessage: 'A questionnaire with this name already exists.'
                    });
                } else {
                    res.status(500).json({
                        errorCode: 'InternalErr',
                        errorMessage: 'An internal error occurred.',
                        errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
                    });
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
                res.sendStatus(204);
            },
            (err) => {
                if (err.code === 409) {
                    res.status(409).json({
                        errorCode: 'QueueVersionDuplicate',
                        errorMessage: 'A questionnaire with this url and version already exists'
                    });
                }
                if (err.code === 404) {
                    res.status(404).json({
                        errorCode: 'QueueNotFound',
                        errorMessage: 'No questionnaire with given url and name found to update'
                    });
                }
                res.status(500).json({
                    errorCode: 'InternalErr',
                    errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
                });
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
    @Get('')
    @Middleware(
        jwt({
            secret: AuthConfig.jwtSecret,
            algorithms: ['HS256'],
            requestProperty: 'payload',
            isRevoked: AuthorizationController.checkApiUserLogin
        })
    )
    public async getQuestionnaireByUrlAndVersion(req: Request, res: Response) {
        let url: string, version: string;
        try {
            url = req.query.url.toString();
            version = req.query.version.toString();
        } catch (err) {
            res.status(400).json({
                errorCode: 'InvalidQuery',
                errMessage: `Query failed with error: '${err.message}'.`,
                errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
            });
            return;
        }

        this.questionnaireModel.getQuestionnaireByUrlAndVersion(url, version).then(
            (response) => {
                if (response.length === 0) {
                    res.status(404).json({
                        errorCode: 'QuestionnaireNotFound',
                        errorMessage: 'No questionnaire found that matches the given parameters.'
                    });
                }
                res.status(200).json(response[0]);
            },
            (err) => {
                res.status(500).json({
                    errorCode: 'Internal error',
                    errorMessage: 'Query failed.',
                    errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
                });
            }
        );
    }
}
