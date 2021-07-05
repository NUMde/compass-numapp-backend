/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { ChildControllers, ClassOptions } from '@overnightjs/core';

import { CronJobNotification } from './CronJobNotification';

/**
 * A hack to have instances of cron jobs instantiated.
 *
 * @export
 * @class CronController
 */
@ClassOptions({ mergeParams: true })
@ChildControllers([new CronJobNotification()])
export class CronController {}
