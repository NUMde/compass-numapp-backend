/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/**
 * Helper interface for the {@link PerformanceLogger}.
 */
export interface MeasurementObject {
    className: string;
    methodName: string;
    timeStart: Date;
}
