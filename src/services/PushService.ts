// Import all the required packages
import {
    Notification as IBMPushNotification,
    PushMessageBuilder,
    PushNotifications,
    PushNotificationsWithApiKey
} from 'ibm-push-notifications';

import { Logger } from '@overnightjs/logger';

import { PushServiceConfig } from '../config/PushServiceConfig';

import type { Response } from 'request';

/**
 * Adapter for the IBM Cloud push service.
 *
 * @export
 * @class PushService
 */
export class PushService {
    private static authenticateAsync(myPushNotifications: PushNotificationsWithApiKey) {
        return new Promise((resolve, reject) => {
            myPushNotifications.getAuthToken((hasToken, accessToken) => {
                Logger.Info('hasToken: ' + hasToken);
                if (hasToken) {
                    resolve(accessToken);
                } else {
                    reject();
                }
            });
        });
    }

    private static sendAsync(
        myPushNotifications: PushNotificationsWithApiKey,
        notificationExample
    ) {
        return new Promise<void>((resolve, reject) => {
            myPushNotifications.send(notificationExample, (error, response: Response, body) => {
                if (error != null) {
                    Logger.Err('Error: ' + error);
                    reject(error);
                }
                if (response.statusCode > 220) {
                    Logger.Warn('Response: ' + JSON.stringify(response));
                    Logger.Warn('Body: ' + body);
                    reject(response.statusCode);
                }
                resolve();
            });
        });
    }

    /**
     * Trigger sending a push message to the given participants. The participants need to have the mobile app installed.
     *
     * @static
     * @param {string} msg The message to send.
     * @param {string[]} participantIds The participantids.
     * @return {*}  {Promise<void>}
     * @memberof PushService
     */
    public static async send(msg: string, participantIds: string[]): Promise<void> {
        Logger.Info(' --> Entering Send');

        if (msg === null) {
            Logger.Warn('No message provided. Skip sending push notifications.');
            return;
        }
        if (participantIds === null || participantIds.length < 1) {
            Logger.Warn('No participantid provided. Skip sending push notifications.');
            return;
        }
        Logger.Imp(`Sending message [${msg}] to [${participantIds.length}] recipients.`);

        // break in case no push config is provided
        if (!PushServiceConfig.getAppId() || !PushServiceConfig.getApiKey()) {
            Logger.Warn('Missing configuration for push service. Skip sending push notifications.');
            return;
        }
        // initialize with push service apikey
        const pushNotificationInstance = new PushNotificationsWithApiKey(
            PushNotifications.Region.FRANKFURT,
            PushServiceConfig.getAppId(),
            PushServiceConfig.getApiKey()
        );

        // trigger authentication with the push service
        await PushService.authenticateAsync(pushNotificationInstance);

        // For APNs settings
        const apns = PushMessageBuilder.APNs.badge(1)
            .interactiveCategory('Accept')
            .iosActionKey('Ok')
            .type(IBMPushNotification.APNsType.DEFAULT)
            .title(msg)
            .sound('default')
            .build();

        // Also timeToLive setting is provided which specifies how long (in seconds)
        // The message should be kept in FCM storage if the device is offline.
        const fcm = PushMessageBuilder.FCM.collapseKey('ping')
            .interactiveCategory('Accept')
            .delayWhileIdle(true)
            .androidTitle(msg)
            .priority(IBMPushNotification.FCMPriority.DEFAULT)
            // time to live is 1d as it will be superseded by the next msg
            .timeToLive(86400.0)
            .sync(true)
            .visibility(IBMPushNotification.Visibility.PUBLIC)
            .build();

        // ATTENTION hack as channelId is not present in the library
        fcm.channelId = PushServiceConfig.getAndroidChannel();

        // Create settings with all platforms optional settings.
        const settings = PushMessageBuilder.Settings.apns(apns).fcm(fcm).build();

        const message = PushMessageBuilder.Message.alert('Zum Öffnen der App tippen').build();

        // specify target
        // const target = PushMessageBuilder.Target.platforms([IBMPushNotification.Platform.Apple, IBMPushNotification.Platform.Google]).build();
        const target = PushMessageBuilder.Target.participantIds(participantIds).build();

        const notification = IBMPushNotification.message(message)
            .target(target)
            .settings(settings)
            .build();

        // Send notification
        await this.sendAsync(pushNotificationInstance, notification);

        Logger.Info(' <-- Message Send');
    }
}
