import { StateChangeTrigger, ParticipantEntry } from '../types';

/**
 * This interface defines all methods, that need to be implemented by a custom state model.
 *
 * @export
 * @interface StateModel
 */
export interface StateModel {
    /**
     * Determine new state relevant data for the given user
     *
     * @param {ParticipantEntry} user
     * @param {string} parameters
     * @return {*}  {ParticipantEntry}
     * @memberof StateModel
     */
    calculateUpdatedData(user: ParticipantEntry, parameters: StateChangeTrigger): ParticipantEntry;
}
