/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import {
    ChildControllers,
    ClassErrorMiddleware,
    ClassOptions,
    Controller
} from '@overnightjs/core';

import { AuthorizationController } from './AuthorizationController';
import { DownloadController } from './DownloadController';
import { QuestionnaireController } from './QuestionnaireController';
import { QueueController } from './QueueController';
import { ParticipantController } from './ParticipantController';

/**
 * Parent controller
 *
 * @export
 * @class ApiController
 */
@Controller('api')
@ClassOptions({ mergeParams: true })
@ClassErrorMiddleware((err, req, res) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({ error: 'invalid_subjectid' });
        throw err;
    }
})
@ChildControllers([
    new AuthorizationController(),
    new DownloadController(),
    new ParticipantController(),
    new QueueController(),
    new QuestionnaireController()
])
export class ApiController {}
