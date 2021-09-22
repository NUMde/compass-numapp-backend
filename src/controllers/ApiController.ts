/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import {
    ChildControllers,
    ClassErrorMiddleware,
    ClassMiddleware,
    ClassOptions,
    Controller
} from '@overnightjs/core';
import cors from 'cors';

import { AuthorizationController } from './AuthorizationController';
import { DownloadController } from './DownloadController';
import { QuestionnaireController } from './QuestionnaireController';
import { QueueController } from './QueueController';
import { ParticipantController } from './ParticipantController';
import { SubjectIdentitiesController } from './SubjectIdentitiesController';

/**
 * Parent controller
 *
 * @export
 * @class ApiController
 */
@Controller('api')
@ClassOptions({ mergeParams: true })
@ClassMiddleware(cors())
@ClassErrorMiddleware((err, req, res) => {
    switch (err) {
        case 'UnauthorizedError':
            res.status(401).send({ error: 'invalid subjectID' });
            throw err;
        case 'UnauthorizedApiUser':
            res.status(401).send({ error: 'unauthorized access' });
            throw err;
        case 'InternalError':
            res.status(500).send({ error: 'internal error' });
            throw err;
    }
})
@ChildControllers([
    new AuthorizationController(),
    new DownloadController(),
    new ParticipantController(),
    new QueueController(),
    new QuestionnaireController(),
    new SubjectIdentitiesController()
])
export class ApiController {}
