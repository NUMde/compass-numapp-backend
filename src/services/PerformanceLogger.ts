/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import logger from 'jet-logger';

import { MeasurementObject } from '../types/MeasurementObject';
import { IdHelper } from './IdHelper';

/**
 * A simple logger that can be used to measure execution times.
 *
 * @export
 * @class PerformanceLogger
 */
export class PerformanceLogger {
    private static performanceMap: MeasurementObject[] = [];

    /**
     * Start execution measurement.
     *
     * @static
     * @param {string} className
     * @param {string} methodName
     * @return {*}  {string}
     * @memberof PerformanceLogger
     */
    public static startMeasurement(className: string, methodName: string): string {
        const uuid: string = IdHelper.createID();
        const timeStart = new Date();
        this.performanceMap[uuid] = { className, methodName, timeStart };
        return uuid;
    }

    /**
     * End execution measurement and print the execution duration.
     *
     * @static
     * @param {string} uuid
     * @memberof PerformanceLogger
     */
    public static endMeasurement(uuid: string): void {
        const timeEnd = new Date();

        if (this.performanceMap[uuid] === undefined) {
            logger.err(`[PerformanceLogger] uuid ${uuid} does not exist. No Measurement.`);
        } else {
            const measurementObject = this.performanceMap[uuid];
            const timeStart = measurementObject.timeStart;
            const diff = Math.abs(timeStart.getTime() - timeEnd.getTime()) / 1000;
            logger.info(
                `[PerformanceLogger]${measurementObject.className}.${measurementObject.methodName} took ${diff}s.`
            );
            delete this.performanceMap[uuid];
        }
    }
}
