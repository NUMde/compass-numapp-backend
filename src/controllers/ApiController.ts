import { DataRecordingSubmissionController } from './vdr/DataRecordingSubmissionController';
import { VisitConsumeController } from './vdr/VisitConsumeController';
/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { ChildControllers, ClassMiddleware, ClassOptions, Controller } from '@overnightjs/core';
import cors from 'cors';

import { AuthorizationController } from './AuthorizationController';
import { DownloadController } from './DownloadController';
import { QuestionnaireController } from './QuestionnaireController';
import { QueueController } from './QueueController';
import { ParticipantController } from './ParticipantController';
import { SubjectIdentitiesController } from './SubjectIdentitiesController';
import { SdrApiInfoController } from './sdr/SdrApiInfoController';
import { SubjectSubmissionController } from './sdr/SubjectSubmissionController';
import { SubjectConsumeController } from './sdr/SubjectConsumeController';
import { VdrApiInfoController } from './vdr/VdrApiInfoController';
import { VisitSubmissionController } from './vdr/VisitSubmissionController';

/**
 * Parent controller
 *
 * @export
 * @class ApiController
 */
@Controller('api')
@ClassOptions({ mergeParams: true })
@ClassMiddleware(cors())
@ChildControllers([
    new AuthorizationController(),
    new DownloadController(),
    new ParticipantController(),
    new QueueController(),
    new QuestionnaireController(),
    new SubjectIdentitiesController(),
    new SdrApiInfoController(),
    new SubjectSubmissionController(),
    new SubjectConsumeController(),
    new VdrApiInfoController(),
    new VisitSubmissionController(),
    new VisitConsumeController(),
    new DataRecordingSubmissionController()
])
export class ApiController {}
