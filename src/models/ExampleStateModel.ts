/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { COMPASSConfig } from '../config/COMPASSConfig';
import { IdHelper } from '../services/IdHelper';
import { StateChangeTrigger, ParticipationStatus, ParticipantEntry } from '../types';
import { StateModel } from './StateModel';

/**
 * Example model based on the GCS state chart.
 * It uses four different questionnaires that are send to the participant depending on some conditions.
 *
 * @export
 * @class ExampleStateModel
 * @implements {StateModel}
 */
export class ExampleStateModel implements StateModel {
    /**
     * Determine new state relevant data for the given participant.
     *
     * @param {ParticipantEntry} participant
     * @param {string} parameters A stringified JSON with parameters that trigger state changes.
     * @return {*}  {ParticipantEntry}
     * @memberof ExampleStateModel
     */
    public calculateUpdatedData(
        participant: ParticipantEntry,
        parameters: StateChangeTrigger
    ): ParticipantEntry {
        const distValues = this.calculateStateValues(participant, parameters);
        const datesAndIterations = this.calculateDates(
            participant,
            distValues.nextInterval,
            distValues.nextDuration,
            distValues.nextStartHour,
            distValues.nextDueHour,
            distValues.startImmediately
        );

        // handle iteration counter for questionnaires
        const iterationsLeft = distValues.additionalIterationsLeft
            ? distValues.additionalIterationsLeft - 1
            : 0;

        // check participation status in study based on defined study dates
        const participationStatus =
            participant.general_study_end_date < new Date() ||
            participant.personal_study_end_date < new Date()
                ? ParticipationStatus['OffStudy']
                : ParticipationStatus['OnStudy'];

        // clone the object and set updated values
        const updatedParticipant: ParticipantEntry = { ...participant };
        updatedParticipant.current_instance_id = IdHelper.createID();
        updatedParticipant.current_questionnaire_id = distValues.nextQuestionnaireId;
        updatedParticipant.start_date = datesAndIterations.startDate;
        updatedParticipant.due_date = datesAndIterations.dueDate;
        updatedParticipant.current_interval = distValues.nextInterval;
        updatedParticipant.additional_iterations_left = iterationsLeft;
        updatedParticipant.status = participationStatus;
        return updatedParticipant;
    }

    private calculateDates(
        participantData: ParticipantEntry,
        nextInterval: number,
        nextDuration: number,
        nextStartHour: number,
        nextDueHour: number,
        startImmediately: boolean
    ): {
        startDate: Date;
        dueDate: Date;
    } {
        const now = new Date(Date.now());
        const intervalStart = new Date(now);
        intervalStart.setDate(
            intervalStart.getDate() + COMPASSConfig.getDefaultIntervalStartIndex()
        );

        /**
         * TODO
         *
         * @param {Date} startDate
         * @param {boolean} [startImmediately]
         * @return {*}
         */
        const calcTime = (startDate: Date, startImmediately?: boolean) => {
            let newStartDate: Date;
            let newDueDate: Date;

            if (COMPASSConfig.useFakeDateCalculation()) {
                // short circuit for testing
                // start date is set to be in 10 seconds and due date is in 30 minutes
                newStartDate = now;
                newStartDate.setSeconds(newStartDate.getSeconds() + 10);

                newDueDate = new Date(newStartDate);
                newDueDate.setSeconds(newDueDate.getSeconds() + 30 * 60);
            } else {
                newStartDate = new Date(startDate);
                if (participantData.start_date) {
                    if (startImmediately) {
                        newStartDate = new Date(intervalStart);
                    } else {
                        newStartDate.setDate(newStartDate.getDate() + nextInterval);
                    }
                }
                newStartDate.setHours(nextStartHour, 0, 0, 0);

                newDueDate = new Date(newStartDate);
                newDueDate.setDate(newDueDate.getDate() + nextDuration);
                newDueDate.setHours(nextDueHour, 0, 0, 0);
            }

            return {
                startDate: newStartDate,
                dueDate: newDueDate
            };
        };

        let dates = calcTime(
            participantData.start_date ? new Date(participantData.start_date) : intervalStart,
            startImmediately
        );

        // loop until the due date is in the future to get valid dates
        while (dates.dueDate < now) {
            dates = calcTime(dates.startDate);
        }
        return dates;
    }

    private calculateStateValues(
        currentParticipant: ParticipantEntry,
        triggerValues: StateChangeTrigger
    ) {
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
            currentParticipant.additional_iterations_left > 0 &&
            currentParticipant.current_questionnaire_id === shortLimitedQuestionnaireId
        ) {
            // Study participant is on short track with limited interval and has iterations left
            const nextDuration =
                currentParticipant.current_interval === shortInterval
                    ? shortDuration
                    : regularDuration;
            const enableShortMode = currentParticipant.current_interval === regularInterval;
            const nextStartHour = enableShortMode ? shortStartHour : regularStartHour;
            const nextDueHour = enableShortMode ? shortDueHour : regularDueHour;
            const startImmediately = false;
            const additionalIterationsLeft = currentParticipant.additional_iterations_left;

            return {
                nextInterval: currentParticipant.current_interval,
                nextDuration: nextDuration,
                nextQuestionnaireId: currentParticipant.current_questionnaire_id,
                nextStartHour: nextStartHour,
                nextDueHour: nextDueHour,
                startImmediately: startImmediately,
                additionalIterationsLeft: additionalIterationsLeft
            };
        } else {
            // determine next questionnaire that will be delivered to the study participant
            let nextQuestionnaireId: string;
            if (triggerValues.specialTrigger && triggerValues.specialTrigger === true) {
                nextQuestionnaireId = shortLimitedQuestionnaireId;
            } else if (triggerValues.basicTrigger && triggerValues.basicTrigger === true) {
                nextQuestionnaireId = shortQuestionnaireId;
            } else if (!currentParticipant.due_date) {
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
