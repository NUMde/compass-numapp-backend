import { StateChangeTrigger, ParticipantEntry } from '../types';

/**
 * This interface defines all methods, that need to be implemented by a custom state model.
 *
 * @export
 * @interface StateModel
 */
export interface StateModel {
    /**
     * Determine new state revelant data for the given user
     *
     * @param {UserEntry} user
     * @param {string} parameters
     * @return {*}  {UserEntry}
     * @memberof StateModel
     */
    calculateUpdatedData(user: ParticipantEntry, parameters: StateChangeTrigger): ParticipantEntry;
}
