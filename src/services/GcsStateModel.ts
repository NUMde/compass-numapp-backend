/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { COMPASSConfig } from '../config/COMPASSConfig';
import { IdHelper } from '../services/IdHelper';
import { UserEntry } from '../types';
import { StateModel } from './StateModel';

/**
 * Custom model specific for the GCS state chart.
 * It uses four different questionnaires that are send to the used depending on some conditions.
 *
 * @export
 * @class GcsStateModel
 * @implements {StateModel}
 */
export class GcsStateModel implements StateModel {
    /**
     * Determine new state revelant data for the given user
     *
     * @param {UserEntry} user
     * @param {string} parameters A stringified JSON with
     * @return {*}  {UserEntry}
     * @memberof GcsStateModel
     */
    public calculateUpdatedData(user: UserEntry, parameters: string): UserEntry {
        const distValues = this.calculateStateValues(user, parameters);
        const datesAndIterations = this.calculateDatesAndRemainingIteration(
            user,
            distValues.nextInterval,
            distValues.nextDuration,
            distValues.nextStartHour,
            distValues.nextDueHour,
            distValues.startImmediately,
            distValues.additionalIterationsLeft
        );

        // clone the object and set updated values
        const updatedUser: UserEntry = { ...user };
        updatedUser.current_instance_id = IdHelper.createID();
        updatedUser.current_questionnaire_id = distValues.nextQuestionnaireId;
        updatedUser.start_date = datesAndIterations.startDate;
        updatedUser.due_date = datesAndIterations.dueDate;
        updatedUser.additional_iterations_left = datesAndIterations.additionalIterationsLeft;
        updatedUser.current_interval = distValues.nextInterval;

        return updatedUser;
    }

    private calculateDatesAndRemainingIteration(
        userData: UserEntry,
        nextInterval: number,
        nextDuration: number,
        nextStartHour: number,
        nextDueHour: number,
        startImmediately: boolean,
        additionalIterationsLeft: number
    ): {
        startDate: Date;
        dueDate: Date;
        additionalIterationsLeft: number;
    } {
        const now = new Date();
        const intervalStart = new Date(now);

        intervalStart.setDate(
            intervalStart.getDate() + COMPASSConfig.getDefaultIntervalStartIndex()
        );

        const calcTime = (startDate: Date, startImmediately?: boolean) => {
            // short circuit for testing
            if (COMPASSConfig.isFakeDatesUsed()) {
                const fakeStart = new Date();
                fakeStart.setSeconds(fakeStart.getSeconds() + 10);

                const fakeDue = new Date(fakeStart);
                fakeDue.setSeconds(fakeDue.getSeconds() + 30 * 60);
                return {
                    startDate: fakeStart,
                    dueDate: fakeDue,
                    additionalIterationsLeft: additionalIterationsLeft
                        ? additionalIterationsLeft - 1
                        : 0
                };
            }

            let newStartDate = new Date(startDate);

            if (userData.start_date) {
                newStartDate = startImmediately
                    ? new Date(intervalStart)
                    : new Date(newStartDate.setDate(newStartDate.getDate() + nextInterval));
            }
            newStartDate = new Date(newStartDate);
            newStartDate.setHours(nextStartHour, 0, 0, 0);

            let newDueDate = new Date(newStartDate);
            newDueDate.setDate(newDueDate.getDate() + nextDuration);
            newDueDate.setHours(nextDueHour, 0, 0, 0);
            newDueDate = new Date(newDueDate);

            return {
                startDate: newStartDate,
                dueDate: newDueDate,
                additionalIterationsLeft: additionalIterationsLeft
                    ? additionalIterationsLeft - 1
                    : 0
            };
        };

        let dates = calcTime(
            userData.start_date ? new Date(userData.start_date) : intervalStart,
            startImmediately
        );

        while (dates.dueDate < now) {
            dates = calcTime(dates.startDate);
        }

        return dates;
    }

    private calculateStateValues(currentUser: UserEntry, parameters: string) {
        const triggerValues: { basicTrigger?: boolean; specialTrigger?: boolean } = JSON.parse(
            parameters
        );

        // get default values
        const shortInterval = COMPASSConfig.getDefaultShortInterval();
        const shortDuration = COMPASSConfig.getDefaultShortDuration();
        const shortStartHour = COMPASSConfig.getDefaultShortStartHour();
        const shortDueHour = COMPASSConfig.getDefaultShortDueHour();

        const regularInterval = COMPASSConfig.getDefaultInterval();
        const regularDuration = COMPASSConfig.getDefaultDuration();
        const regularStartHour = COMPASSConfig.getDefaultStartHour();
        const regularDueHour = COMPASSConfig.getDefaultDueHour();

        const initialQuestionnaireId = COMPASSConfig.getInitialQuestionnaireId();
        const defaultQuestionnaireId = COMPASSConfig.getDefaultQuestionnaireId();
        const shortQuestionnaireId = COMPASSConfig.getDefaultShortQuestionnaireId();
        const shortLimitedQuestionnaireId = COMPASSConfig.getDefaultShortLimitedQuestionnaireId();

        const iterationCount = COMPASSConfig.getDefaultIterationCount();

        if (
            currentUser.additional_iterations_left > 0 &&
            currentUser.current_questionnaire_id === shortLimitedQuestionnaireId
        ) {
            // User is on short track with limited interval and has iterations left
            const nextDuration =
                currentUser.current_interval === shortInterval ? shortDuration : regularDuration;
            const enableShortmode = currentUser.current_interval === regularInterval;
            const nextStartHour = enableShortmode ? shortStartHour : regularStartHour;
            const nextDueHour = enableShortmode ? shortDueHour : regularDueHour;
            const startImmediately = false;
            const additionalIterationsLeft = currentUser.additional_iterations_left;

            return {
                nextInterval: currentUser.current_interval,
                nextDuration: nextDuration,
                nextQuestionnaireId: currentUser.current_questionnaire_id,
                nextStartHour: nextStartHour,
                nextDueHour: nextDueHour,
                startImmediately: startImmediately,
                additionalIterationsLeft: additionalIterationsLeft
            };
        } else {
            // determine next questionnaire that will be delivered to the user
            let nextQuestionnaireId: string;
            if (triggerValues.specialTrigger) {
                nextQuestionnaireId = shortLimitedQuestionnaireId;
            } else if (triggerValues.basicTrigger) {
                nextQuestionnaireId = shortQuestionnaireId;
            } else if (!currentUser.due_date) {
                nextQuestionnaireId = initialQuestionnaireId;
            } else {
                nextQuestionnaireId = defaultQuestionnaireId;
            }

            // determine other values
            const switchToShortInterval =
                triggerValues.basicTrigger || triggerValues.specialTrigger;

            const nextInterval = switchToShortInterval ? shortInterval : regularInterval;
            const nextDuration = switchToShortInterval ? shortDuration : regularDuration;
            const nextStartHour = switchToShortInterval ? shortStartHour : regularStartHour;
            const nextDueHour = switchToShortInterval ? shortDueHour : regularDueHour;
            const startImmediately = switchToShortInterval;
            const additionalIterationsLeft = triggerValues.specialTrigger ? iterationCount : 1;

            return {
                nextInterval: nextInterval,
                nextDuration: nextDuration,
                nextQuestionnaireId: nextQuestionnaireId,
                nextStartHour: nextStartHour,
                nextDueHour: nextDueHour,
                startImmediately: startImmediately,
                additionalIterationsLeft: additionalIterationsLeft
            };
        }
    }
}
