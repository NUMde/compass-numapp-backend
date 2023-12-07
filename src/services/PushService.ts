import { PushServiceConfig } from '../config/PushServiceConfig';
/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import * as admin from 'firebase-admin';

import logger from 'jet-logger';

/**
 * Adapter for the Firebase Cloud Messaging service.
 *
 * @export
 * @class PushService
 */
export class PushService {
    private static fcmInstance: admin.app.App;

    public constructor() {
        if (!PushService.fcmInstance) {
            // Initialize the SDK
            logger.info('Initializing Firebase Cloud Messaging');
            PushService.fcmInstance = admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
        }
    }

    /**
     * Trigger sending a push message to the given participants.
     *
     * @static
     * @param {string} msg The message to send.
     * @param {string[]} deviceToken The device token to address.
     * @return {*}  {Promise<void>}
     * @memberof PushService
     */
    public async send(msg: string, deviceToken: string[]): Promise<void> {
        logger.info(' --> Entering Send');

        if (msg === null) {
            logger.warn('No message provided. Skip sending push notifications.');
            return;
        }
        if (deviceToken === null || deviceToken.length < 1) {
            logger.warn('No participantid provided. Skip sending push notifications.');
            return;
        }
        if (PushServiceConfig.getCredentialFile().length === 0) {
            logger.err(
                'Credential file for push service not set. Skip sending push notifications.'
            );
            return;
        }

        logger.imp(`Sending message [${msg}] to [${deviceToken.length}] recipients.`);

        const android: admin.messaging.AndroidConfig = {
            collapseKey: 'Accept',
            priority: 'normal',
            ttl: 86400 // time to live is 1d as it will be superseded by the next msg
        };

        // TODO Adjust as needed for a new iOS app
        const apns: admin.messaging.ApnsConfig = {
            payload: {
                aps: {
                    category: 'Accept',
                    sound: {
                        name: 'Default'
                    }
                }
            }
        };

        let successCount = 0;
        const failedTokens = [];

        const queries: Promise<{ success: boolean; token: string | undefined }>[] = [];

        deviceToken.forEach((registrationToken) => {
            // build message
            const message: admin.messaging.Message = {
                notification: {
                    title: msg,
                    body: 'Zum Öffnen der App tippen'
                },
                token: registrationToken,
                android,
                apns
            };

            // Send a message to the devices corresponding to the provided
            // registration tokens.

            queries.push(
                admin
                    .messaging()
                    .send(message)
                    .then((response) => {
                        if (response) {
                            return { success: true, token: undefined };
                        } else {
                            return { success: false, token: registrationToken };
                        }
                    })
                    .catch((error) => {
                        logger.err('Error sending message: ' + error);
                        return { success: false, token: registrationToken };
                    })
            );
        });

        const results = await Promise.allSettled(queries);

        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    successCount++;
                } else {
                    failedTokens.push(result.value.token);
                }
            }
        });

        logger.info(successCount + ' messages were sent successfully');
        logger.err('List of tokens that caused failures: ' + failedTokens);

        logger.info(' <-- Leaving Send');
    }
}
