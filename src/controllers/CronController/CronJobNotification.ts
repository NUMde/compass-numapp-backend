/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import logger from 'jet-logger';
import { PushServiceConfig } from '../../config/PushServiceConfig';

import { ParticipantModel } from '../../models/ParticipantModel';
import { PerformanceLogger } from '../../services/PerformanceLogger';
import { PushService } from '../../services/PushService';
import { AbstractCronJob } from './AbstractCronJob';

/**
 * A cron job that sends push notifications.
 *
 * @export
 * @class CronJobNotification
 * @extends {AbstractCronJob}
 */
export class CronJobNotification extends AbstractCronJob {
    private participantModel: ParticipantModel = new ParticipantModel();
    private pushService: PushService = new PushService();

    constructor() {
        super('0 6 * * *'); // at 6:00 Local Time (GMT+02:00)
    }

    /**
     * Execute the job.
     *
     * @memberof CronJobNotification
     */
    public async executeJob(): Promise<void> {
        logger.info('Cronjob CronJobNotification fired at [' + new Date() + ']');
        const perfLog = PerformanceLogger.startMeasurement('CronJobNotification', 'executeJob');

        // ATTENTION: keep this in sync with the start time of this cron job
        // some dates in the DB are also set to 6 o'clock and this method is not guaranteed to run at 6 o'clock sharp, so we set an exact time, to prevent issues
        // Implementation detail: The timestamp columns in the DB are defined w/o timezone
        const now = new Date();
        now.setUTCHours(6, 0, 0, 0);

        // Reminder - download questionnaire
        try {
            const participantsWithNewQuestionnaires =
                await this.participantModel.getParticipantsWithAvailableQuestionnairs(now);
            const downloadMsg = PushServiceConfig.getDownloadMessage();
            await this.pushService.send(downloadMsg, participantsWithNewQuestionnaires);
        } catch (error) {
            logger.err(error, true);
        }

        // Reminder - upload questionnaire
        try {
            const participantsWithPendingUploads =
                await this.participantModel.getParticipantsWithPendingUploads(now);
            const uploadMsg = PushServiceConfig.getUploadMessage();
            await this.pushService.send(uploadMsg, participantsWithPendingUploads);
        } catch (error) {
            logger.err(error, true);
        }

        PerformanceLogger.endMeasurement(perfLog);
    }
}
