/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import { CronJob } from 'cron';

import { Logger } from '@overnightjs/logger';

/**
 * A base class for all cron jobs.
 *
 * @export
 * @abstract
 * @class AbstractCronJob
 */
export abstract class AbstractCronJob {
    private job: CronJob;

    /**
     * Creates an instance of AbstractCronJob.
     *
     * @param {string} [pattern] Despite the official Unix cron format, the used library support seconds digits. Leaving it off will default to 0 and match the Unix behavior.
     * @memberof AbstractCronJob
     */
    constructor(pattern: string) {
        this.job = new CronJob(pattern, () => this.executeJob(), null, true);
        Logger.Info('Created Cronjob');
        Logger.Info('Running: [' + this.job.running + ']');
        Logger.Imp('Next executions: ');
        Logger.Imp(this.job.nextDates(5), true);
    }

    protected abstract executeJob(): Promise<void>;
}
