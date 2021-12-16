import { ExampleStateModel } from './../../src/models/ExampleStateModel';
import * as dotenv from 'dotenv';
import { COMPASSConfig } from '../../src/config/COMPASSConfig';

import { StateChangeTrigger, ParticipantEntry, ParticipationStatus } from '../../src/types';

describe('signing', () => {
    dotenv.config({ path: './.env' });
    const sut = new ExampleStateModel();
    let realDateNow;
    const initialDate = new Date(1572393600000);

    beforeAll(() => {
        realDateNow = Date.now.bind(global.Date);
        global.Date.now = jest.fn(() => 1572393600000); // 2019-10-30T00:00Z0 (GMT)
    });

    afterAll(() => {
        global.Date.now = realDateNow;
    });

    it('mustGoToInitialState', () => {
        // given
        const user: ParticipantEntry = {
            subject_id: '1',
            last_action: null,
            current_questionnaire_id: '',
            start_date: null,
            due_date: null,
            current_instance_id: null,
            current_interval: null,
            additional_iterations_left: null,
            status: ParticipationStatus.OnStudy,
            general_study_end_date: undefined,
            personal_study_end_date: undefined,
            language_code: 'de'
        };
        const parameters: StateChangeTrigger = {};

        // when
        const result = sut.calculateUpdatedData(user, parameters);

        // then

        //set up expected values
        const expectedStartDate = setUpExpectedStartDate(
            initialDate,
            COMPASSConfig.getDefaultStartHour()
        );
        const expectedDueDate = setUpExpectedDueDate(
            expectedStartDate,
            COMPASSConfig.getDefaultDuration(),
            COMPASSConfig.getDefaultDueHour()
        );

        expect(result.subject_id).toBe('1');
        expect(result.last_action).toBe(null);
        expect(result.current_questionnaire_id).toBe(COMPASSConfig.getInitialQuestionnaireId());
        expect(result.start_date.toISOString()).toBe(expectedStartDate.toISOString());
        expect(result.due_date.toISOString()).toBe(expectedDueDate.toISOString());
        expect(result.current_interval).toBe(COMPASSConfig.getDefaultInterval());
        expect(result.additional_iterations_left).toBe(0);
    });

    it('mustGoToDefaultState', () => {
        // given
        const user: ParticipantEntry = {
            subject_id: '1',
            last_action: null,
            current_questionnaire_id: COMPASSConfig.getInitialQuestionnaireId(),
            start_date: null,
            due_date: new Date(Date.now()),
            current_instance_id: null,
            current_interval: 1,
            additional_iterations_left: 0,
            status: ParticipationStatus.OnStudy,
            general_study_end_date: new Date(),
            personal_study_end_date: new Date(),
            language_code: COMPASSConfig.getDefaultLanguageCode()
        };
        const parameters: StateChangeTrigger = {};

        // when
        const result = sut.calculateUpdatedData(user, parameters);

        // then
        //set up expected values
        const expectedStartDate = setUpExpectedStartDate(
            initialDate,
            COMPASSConfig.getDefaultStartHour()
        );
        const expectedDueDate = setUpExpectedDueDate(
            expectedStartDate,
            COMPASSConfig.getDefaultDuration(),
            COMPASSConfig.getDefaultDueHour()
        );

        expect(result.subject_id).toBe('1');
        expect(result.last_action).toBe(null);
        expect(result.current_questionnaire_id).toBe(COMPASSConfig.getDefaultQuestionnaireId());
        expect(result.start_date.toISOString()).toBe(expectedStartDate.toISOString());
        expect(result.due_date.toISOString()).toBe(expectedDueDate.toISOString());
        expect(result.current_instance_id).toBeTruthy();
        expect(result.current_interval).toBe(COMPASSConfig.getDefaultInterval());
        expect(result.additional_iterations_left).toBe(0);
    });

    it('mustGoToShortTrackState', () => {
        // given
        const user: ParticipantEntry = {
            subject_id: '1',
            last_action: null,
            current_questionnaire_id: COMPASSConfig.getInitialQuestionnaireId(),
            start_date: null,
            due_date: new Date(Date.now()),
            current_instance_id: null,
            current_interval: 1,
            additional_iterations_left: 0,
            status: ParticipationStatus.OnStudy,
            general_study_end_date: new Date(),
            personal_study_end_date: new Date(),
            language_code: COMPASSConfig.getDefaultLanguageCode()
        };
        const parameters: StateChangeTrigger = { basicTrigger: true };

        // when
        const result = sut.calculateUpdatedData(user, parameters);

        // then
        //set up expected values
        const expectedStartDate = setUpExpectedStartDate(
            initialDate,
            COMPASSConfig.getDefaultShortStartHour()
        );
        const expectedDueDate = setUpExpectedDueDate(
            expectedStartDate,
            COMPASSConfig.getDefaultShortDuration(),
            COMPASSConfig.getDefaultShortDueHour()
        );

        expect(result.subject_id).toBe('1');
        expect(result.last_action).toBe(null);
        expect(result.current_questionnaire_id).toBe(
            COMPASSConfig.getDefaultShortQuestionnaireId()
        );
        expect(result.start_date.toISOString()).toBe(expectedStartDate.toISOString());
        expect(result.due_date.toISOString()).toBe(expectedDueDate.toISOString());
        expect(result.current_instance_id).toBeTruthy();
        expect(result.current_interval).toBe(COMPASSConfig.getDefaultShortInterval());
        expect(result.additional_iterations_left).toBe(0);
    });

    it('mustGoToShortTrackState', () => {
        // given
        const user: ParticipantEntry = {
            subject_id: '1',
            last_action: null,
            current_questionnaire_id: COMPASSConfig.getInitialQuestionnaireId(),
            start_date: null,
            due_date: new Date(Date.now()),
            current_instance_id: null,
            current_interval: 1,
            additional_iterations_left: 0,
            status: ParticipationStatus.OnStudy,
            general_study_end_date: new Date(),
            personal_study_end_date: new Date(),
            language_code: COMPASSConfig.getDefaultLanguageCode()
        };
        const parameters: StateChangeTrigger = { specialTrigger: true };

        // when
        const result = sut.calculateUpdatedData(user, parameters);

        // then
        //set up expected values
        const expectedStartDate = setUpExpectedStartDate(
            initialDate,
            COMPASSConfig.getDefaultShortStartHour()
        );
        const expectedDueDate = setUpExpectedDueDate(
            expectedStartDate,
            COMPASSConfig.getDefaultShortDuration(),
            COMPASSConfig.getDefaultShortDueHour()
        );
        expect(result.subject_id).toBe('1');
        expect(result.last_action).toBe(null);
        expect(result.current_questionnaire_id).toBe(
            COMPASSConfig.getDefaultShortLimitedQuestionnaireId()
        );
        expect(result.start_date.toISOString()).toBe(expectedStartDate.toISOString());
        expect(result.due_date.toISOString()).toBe(expectedDueDate.toISOString());
        expect(result.current_instance_id).toBeTruthy();
        expect(result.current_interval).toBe(COMPASSConfig.getDefaultShortInterval());
        expect(result.additional_iterations_left).toBe(
            COMPASSConfig.getDefaultIterationCount() - 1
        );
    });
});

/**
 * calculate expected start date based on given initial date
 *
 * @param {Date} initialDate the initial date
 */
const setUpExpectedStartDate = (initialDate: Date, startHour: number) => {
    const expectedStartDate = new Date(initialDate);
    expectedStartDate.setDate(initialDate.getDate() + COMPASSConfig.getDefaultIntervalStartIndex());
    expectedStartDate.setHours(startHour);
    return expectedStartDate;
};
/**
 * calculate expected due date based on given start date and duration
 *
 * @param {Date} startDate the given start date
 * @param {number} duration the duration of the current interval
 */
const setUpExpectedDueDate = (startDate: Date, duration: number, dueHour: number) => {
    const expectedDueDate = new Date(startDate);
    expectedDueDate.setDate(startDate.getDate() + duration);
    expectedDueDate.setHours(dueHour);
    return expectedDueDate;
};
