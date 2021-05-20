import { ExampleStateModel } from './../../src/models/ExampleStateModel';
import * as dotenv from 'dotenv';
import { COMPASSConfig } from '../../src/config/COMPASSConfig';

import { StateChangeTrigger, UserEntry } from '../../src/types';

describe('signing', () => {
    dotenv.config({ path: './.env' });
    const sut = new ExampleStateModel();
    let realDateNow;

    beforeAll(() => {
        realDateNow = Date.now.bind(global.Date);
        global.Date.now = jest.fn(() => 1572393600000); // 2019-10-30T00:00Z0 (GMT)
    });

    afterAll(() => {
        global.Date.now = realDateNow;
    });

    it('mustGoToInitialState', () => {
        // given
        const user: UserEntry = {
            study_id: '1',
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
        expect(result.study_id).toBe('1');
        expect(result.last_action).toBe(null);
        expect(result.current_questionnaire_id).toBe(COMPASSConfig.getInitialQuestionnaireId());
        expect(result.start_date.toISOString()).toBe('2019-10-31T05:00:00.000Z');
        expect(result.due_date.toISOString()).toBe('2019-11-03T17:00:00.000Z');
        expect(result.current_interval).toBe(7);
        expect(result.additional_iterations_left).toBe(0);
    });

    it('mustGoToDefaultState', () => {
        // given
        const user: UserEntry = {
            study_id: '1',
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
        expect(result.study_id).toBe('1');
        expect(result.last_action).toBe(null);
        expect(result.current_questionnaire_id).toBe(COMPASSConfig.getDefaultQuestionnaireId());
        expect(result.start_date.toISOString()).toBe('2019-10-31T05:00:00.000Z');
        expect(result.due_date.toISOString()).toBe('2019-11-03T17:00:00.000Z');
        expect(result.current_instance_id).toBeTruthy();
        expect(result.current_interval).toBe(7);
        expect(result.additional_iterations_left).toBe(0);
    });

    it('mustGoToShortTrackState', () => {
        // given
        const user: UserEntry = {
            study_id: '1',
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
        expect(result.study_id).toBe('1');
        expect(result.last_action).toBe(null);
        expect(result.current_questionnaire_id).toBe(
            COMPASSConfig.getDefaultShortQuestionnaireId()
        );
        expect(result.start_date.toISOString()).toBe('2019-10-31T05:00:00.000Z');
        expect(result.due_date.toISOString()).toBe('2019-11-01T17:00:00.000Z');
        expect(result.current_instance_id).toBeTruthy();
        expect(result.current_interval).toBe(2);
        expect(result.additional_iterations_left).toBe(0);
    });

    it('mustGoToShortTrackState', () => {
        // given
        const user: UserEntry = {
            study_id: '1',
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
        expect(result.study_id).toBe('1');
        expect(result.last_action).toBe(null);
        expect(result.current_questionnaire_id).toBe(
            COMPASSConfig.getDefaultShortLimitedQuestionnaireId()
        );
        expect(result.start_date.toISOString()).toBe('2019-10-31T05:00:00.000Z');
        expect(result.due_date.toISOString()).toBe('2019-11-01T17:00:00.000Z');
        expect(result.current_instance_id).toBeTruthy();
        expect(result.current_interval).toBe(2);
        expect(result.additional_iterations_left).toBe(4);
    });
});
