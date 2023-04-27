/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import { CronJob } from 'cron';
import { DateTime } from 'luxon';

import logger from 'jet-logger';

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
        logger.info('Created Cronjob');
        logger.info('Running: [' + this.job.running + ']');
        logger.imp('Next executions: ');
        const nextDates = this.job.nextDates(5) as DateTime[];
        logger.imp(
            nextDates.map((date) => date.toString()),
            true
        );
    }

    protected abstract executeJob(): Promise<void>;
}
