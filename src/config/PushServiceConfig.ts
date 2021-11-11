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
     * The (relative) path to the configuration file for the Firebase Admin API.
     * See: https://cloud.google.com/docs/authentication/production
     * and: https://firebase.google.com/docs/cloud-messaging/auth-server#provide-credentials-manually
     */
    public static getCredentialFile(): string {
        return env.get('GOOGLE_APPLICATION_CREDENTIALS').default('').asString();
    }

    /**
     * The message send as a push notification in case of newly available questionnaires.
     */
    public static getDownloadMessage(): string {
        return env
            .get('PUSH_MSG_DOWNLOAD')
            .default('Es liegt ein neuer Fragebogen für Sie bereit')
            .asString();
    }

    /**
     * The message send as a push notification in case a participant needs to upload a questionnaire.
     */
    public static getUploadMessage(): string {
        return env
            .get('PUSH_MSG_UPLOAD')
            .default('Bitte denken Sie an das Absenden Ihres Fragebogens')
            .asString();
    }
}
