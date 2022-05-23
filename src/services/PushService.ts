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
    public async send(msg: string, registrationTokens: string[]): Promise<void> {
        logger.info(' --> Entering Send');

        if (msg === null) {
            logger.warn('No message provided. Skip sending push notifications.');
            return;
        }
        if (registrationTokens === null || registrationTokens.length < 1) {
            logger.warn('No participantid provided. Skip sending push notifications.');
            return;
        }
        if (PushServiceConfig.getCredentialFile().length === 0) {
            logger.err(
                'Credential file for push service not set. Skip sending push notifications.'
            );
            return;
        }

        logger.imp(`Sending message [${msg}] to [${registrationTokens.length}] recipients.`);

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

        this.chunkArray(registrationTokens, 500).forEach(async (chunk) => {
            // build message
            const message: admin.messaging.MulticastMessage = {
                notification: {
                    title: msg,
                    body: 'Zum Öffnen der App tippen'
                },
                tokens: chunk,
                android,
                apns
            };

            // Send a message to the device corresponding to the provided
            // registration token.
            try {
                const response = await admin.messaging().sendMulticast(message);
                logger.info(response.successCount + ' messages were sent successfully');
                if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(registrationTokens[idx]);
                        }
                    });
                    logger.err('List of tokens that caused failures: ' + failedTokens);
                }
            } catch (error) {
                logger.err('Error sending message: ' + error);
            }
        });

        logger.info(' <-- Leaving Send');
    }

    /**
     * Returns an array of arrays of the given size.
     *
     * @param {T[]} array The array to split
     * @param {number} chunkSize Size of every chunk
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        if (chunkSize <= 0) {
            throw 'Invalid chunk size';
        }
        const result = [];
        const arrayLength = array.length;
        for (let i = 0; i < arrayLength; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
        }
        return result;
    }
}
