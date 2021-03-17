/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import * as env from 'env-var';

/**
 * Configuration parameters for the push service.
 *
 * @export
 * @class PushServiceConfig
 */
export class PushServiceConfig {
    /**
     * The api key to authenticate against the used Cloud Push Service isntance.
     */
    public static getApiKey(): string {
        return env.get('PUSH_API_KEY').default('').asString();
    }

    /**
     * The application id of the Cloud Push Service instance.
     */
    public static getAppId(): string {
        return env.get('PUSH_APP_ID').default('').asString();
    }

    /**
     * The secret used by the client/app to register with the Cloud Push Service.
     */
    public static getClientSecret(): string {
        return env.get('PUSH_CLIENT_SECRET').default('').asString();
    }

    /**
     * The channel id used for android push messages. Must match the settings in the Cloud Push Service.
     */
    public static getAndroidChannel(): string {
        return env.get('PUSH_ANDROID_CHANNEL').default('Channel1').asString();
    }

    /**
     * The message send as a push notification in case of newly available questionnairs.
     */
    public static getDownloadMessage(): string {
        return env
            .get('PUSH_MSG_DOWNLOAD')
            .default('Es liegt ein neuer Fragebogen für Sie bereit')
            .asString();
    }

    /**
     * The message send as a push notification in case a user needs to upload a questionnair.
     */
    public static getUploadMessage(): string {
        return env
            .get('PUSH_MSG_UPLOAD')
            .default('Bitte denken Sie an das Absenden Ihres Fragebogens')
            .asString();
    }
}
