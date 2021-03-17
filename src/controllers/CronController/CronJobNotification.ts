/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import { Logger } from '@overnightjs/logger';
import { PushServiceConfig } from '../../config/PushServiceConfig';

import { UserModel } from '../../models/UserModel';
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
    private userModel: UserModel = new UserModel();

    constructor() {
        super('0 6 * * *'); // at 6:00 Local Time (GMT+02:00)
    }

    /**
     * Execute the job.
     *
     * @memberof CronJobNotification
     */
    public async executeJob(): Promise<void> {
        Logger.Info('Cronjob CronJobNotification fired at [' + new Date() + ']');
        const perfLog = PerformanceLogger.startMeasurement('CronJobNotification', 'executeJob');

        // ATTENTION: keep this in sync with the start time of this cron job
        // some dates in the DB are also set to 6 o'clock and this method is not guaranteed to run at 6 o'clock sharp, so we set an exact time, to prevent issues
        // Implementation detail: The timestamp columns in the DB are defined w/o timezone
        const now = new Date();
        now.setUTCHours(6, 0, 0, 0);

        // Reminder - download questionnair
        try {
            const usersWithNewQuestionnairs = await this.userModel.getUsersWithAvailableQuestionnairs(
                now
            );
            const downloadMsg = PushServiceConfig.getDownloadMessage();
            await PushService.send(downloadMsg, usersWithNewQuestionnairs);
        } catch (error) {
            Logger.Err(error, true);
        }

        // Reminder - upload questionnair
        try {
            const usersWithPendingUploads = await this.userModel.getUsersWithPendingUploads(now);
            const uploadMsg = PushServiceConfig.getUploadMessage();
            await PushService.send(uploadMsg, usersWithPendingUploads);
        } catch (error) {
            Logger.Err(error, true);
        }

        PerformanceLogger.endMeasurement(perfLog);
    }
}
