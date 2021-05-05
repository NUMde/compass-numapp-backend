// TODO add reference to the rules config, once the logic is implemented
/**
 * Logic trigger that are defined in the rules config.
 *
 *
 * @export
 * @interface StateTrigger
 */
export interface StateChangeTrigger {
    /**
     * Trigger for ?
     *
     * @type {boolean}
     * @memberof StateTrigger
     */
    basicTrigger?: boolean;

    /**
     * Trigger for ?
     *
     * @type {boolean}
     * @memberof StateTrigger
     */
    specialTrigger?: boolean;
}
