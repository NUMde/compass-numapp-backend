import { ExampleStateModel } from './../../src/models/ExampleStateModel';
import * as dotenv from 'dotenv';
import { COMPASSConfig } from '../../src/config/COMPASSConfig';

import { StateChangeTrigger, ParticipantEntry } from '../../src/types';

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
            additional_iterations_left: null
        };
        const parameters: StateChangeTrigger = {};

        // when
        const result = sut.calculateUpdatedData(user, parameters);

        // then

        //set up expected values
        const expectedStartDate = new Date(initialDate);
        expectedStartDate.setDate(
            initialDate.getDate() + COMPASSConfig.getDefaultIntervalStartIndex()
        );
        expectedStartDate.setHours(COMPASSConfig.getDefaultStartHour());

        const expectedDueDate = new Date(expectedStartDate);
        expectedDueDate.setDate(expectedStartDate.getDate() + COMPASSConfig.getDefaultDuration());
        expectedDueDate.setHours(COMPASSConfig.getDefaultDueHour());

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
            additional_iterations_left: 0
        };
        const parameters: StateChangeTrigger = {};

        // when
        const result = sut.calculateUpdatedData(user, parameters);

        // then
        //set up expected values
        const expectedStartDate = new Date(initialDate);
        expectedStartDate.setDate(
            initialDate.getDate() + COMPASSConfig.getDefaultIntervalStartIndex()
        );
        expectedStartDate.setHours(COMPASSConfig.getDefaultStartHour());

        const expectedDueDate = new Date(expectedStartDate);
        expectedDueDate.setDate(expectedStartDate.getDate() + COMPASSConfig.getDefaultDuration());
        expectedDueDate.setHours(COMPASSConfig.getDefaultDueHour());

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
            additional_iterations_left: 0
        };
        const parameters: StateChangeTrigger = { basicTrigger: true };

        // when
        const result = sut.calculateUpdatedData(user, parameters);

        // then
        //set up expected values
        const expectedStartDate = new Date(initialDate);
        expectedStartDate.setDate(
            initialDate.getDate() + COMPASSConfig.getDefaultIntervalStartIndex()
        );
        expectedStartDate.setHours(COMPASSConfig.getDefaultStartHour());

        const expectedDueDate = new Date(expectedStartDate);
        expectedDueDate.setDate(
            expectedStartDate.getDate() + COMPASSConfig.getDefaultShortDuration()
        );

        expectedDueDate.setHours(COMPASSConfig.getDefaultDueHour());

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
            additional_iterations_left: 0
        };
        const parameters: StateChangeTrigger = { specialTrigger: true };

        // when
        const result = sut.calculateUpdatedData(user, parameters);

        // then
        //set up expected values
        const expectedStartDate = new Date(initialDate);
        expectedStartDate.setDate(
            initialDate.getDate() + COMPASSConfig.getDefaultIntervalStartIndex()
        );
        expectedStartDate.setHours(COMPASSConfig.getDefaultStartHour());

        const expectedDueDate = new Date(expectedStartDate);
        expectedDueDate.setDate(
            expectedStartDate.getDate() + COMPASSConfig.getDefaultShortDuration()
        );
        expectedDueDate.setHours(COMPASSConfig.getDefaultDueHour());
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
