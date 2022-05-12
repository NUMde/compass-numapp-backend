/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import * as env from 'env-var';

export class COMPASSConfig {
    /**
     * Gets the value the type-attribute of a request must hold so that the backend knows that
     * its body holds an encrypted questionnaire response. This is necessary because of said encryption,
     * as there is no other way to determine what the body holds without decrypting it.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getQuestionnaireResponseType(): string {
        return env.get('COMPASS_QR_REQUEST_TYPE').default('questionnaire_response').asString();
    }

    /**
     * Gets the default interval for a regular questionnaire. This determines after what amount of days a new iteration starts.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultInterval(): number {
        return env.get('COMPASS_DEFAULT_INTERVAL').default(7).asIntPositive();
    }

    /**
     * Get the default duration for a regular questionnaire. This determines how many days the participant has to complete the questionnaire after the start of an interval.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultDuration(): number {
        return env.get('COMPASS_DEFAULT_DURATION').default(3).asIntPositive();
    }

    /**
     * Gets the default interval of the short track.
     *
     * Defaults to 2
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultShortInterval(): number {
        return env.get('COMPASS_DEFAULT_SHORT_INTERVAL').default(2).asIntPositive();
    }

    /**
     * Gets the default duration of the short track.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultShortDuration(): number {
        return env.get('COMPASS_DEFAULT_SHORT_DURATION').default(1).asIntPositive();
    }

    /**
     * Gets the default due hour for regular questionnaires. It is the full hour of the day, when a regular questionnaire has to be submitted.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultDueHour(): number {
        return env.get('COMPASS_DEFAULT_DUE_HOUR').default(18).asIntPositive();
    }

    /**
     * Gets the default start hour for regular questionnaires. The full hour of day, when a regular questionnaire starts.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultStartHour(): number {
        return env.get('COMPASS_DEFAULT_START_HOUR').default(6).asIntPositive();
    }

    /**
     * Gets the default due hour for questionnaires on the short track. It is the time of the day, when a questionnaire has to be submitted for the short track.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultShortDueHour(): number {
        return env.get('COMPASS_DEFAULT_SHORT_DUE_HOUR').default(18).asIntPositive();
    }

    /**
     * Gets the default start hour for questionnaires on the short track. The time of day, when a questionnaire starts for the short track.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultShortStartHour(): number {
        return env.get('COMPASS_DEFAULT_SHORT_START_HOUR').default(6).asIntPositive();
    }

    /**
     * The iterative questionnaire track only lasts for a predetermined number of iteration. This getter provides that value.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultIterationCount(): number {
        return env.get('COMPASS_DEFAULT_ITERATION_COUNT').default(5).asIntPositive();
    }

    /**
     * The id of the initial questionnaire.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getInitialQuestionnaireId(): string {
        return env.get('COMPASS_INITIAL_QUESTIONNAIRE_ID').default('initial').asString();
    }

    /**
     * The id of the default questionnaire.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getDefaultQuestionnaireId(): string {
        return env
            .get('COMPASS_DEFAULT_QUESTIONNAIRE_ID')
            .default('https://num-compass.science/fhir/Questionnaires/GECCO|1.0')
            .asString();
    }

    /**
     * The id if the questionnaire for the short track.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getDefaultShortQuestionnaireId(): string {
        return env.get('COMPASS_DEFAULT_SHORT_QUESTIONNAIRE_ID').default('q_1.0').asString();
    }

    /**
     * The id of the questionnaire with limited interval and on short track.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getDefaultShortLimitedQuestionnaireId(): string {
        return env
            .get('COMPASS_DEFAULT_SHORT_LIMITED_QUESTIONNAIRE_ID')
            .default('7f13fc11-51ed-4277-b92e-770e9739895b')
            .asString();
    }

    /**
     * Gets the starting index for a new interval. Example: If a participant sends in a report, he/she switches to
     * another track. Does this track start today (meaning now) or tomorrow morning?
     * With the defaultInterval being 0 the new track starts immediately, with 1 the track would start tomorrow.
     *
     * Defaults to 1.
     *
     * @static
     * @return {*}  {number}
     * @memberof COMPASSConfig
     */
    public static getDefaultIntervalStartIndex(): number {
        return env.get('COMPASS_DEFAULT_INTERVAL_START_INDEX').default(1).asIntPositive();
    }

    /**
     * The default language_code for questionnaire retrieval.
     * Used as fallback if no questionnaire exists for preferred user language.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getDefaultLanguageCode(): string {
        return env.get('COMPASS_DEFAULT_LANGUAGE_CODE').default('de').asString();
    }

    /**
     * The certificate to use for the encryption of the client data.
     * It is the public certificate of the receiver of the data.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getRecipientCertificate(): string {
        return env
            .get('COMPASS_RECIPIENT_CERTIFICATE')
            .default('false')
            .asString()
            .replace(/\\n/g, '\n');
    }

    /**
     * Flag to toggle fake date calculation to ease testing.
     */
    public static useFakeDateCalculation(): boolean {
        return env.get('COMPASS_USE_FAKE_DATES').default('false').asBoolStrict();
    }

    /**
     * A private key.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getIBMPrivateKey(): string {
        return env.get('COMPASS_PRIVATE_KEY').default('false').asString().replace(/\\n/g, '\n');
    }

    /**
     * A public key.
     *
     * @static
     * @return {*}  {string}
     * @memberof COMPASSConfig
     */
    public static getIBMPublicKey(): string {
        return env.get('COMPASS_PUBLIC_KEY').default('false').asString().replace(/\\n/g, '\n');
    }
}
