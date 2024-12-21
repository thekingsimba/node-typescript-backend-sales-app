import { parentPort } from 'worker_threads';

import { IUser } from '../users/user.interface';
import { send_notification_to_one_user } from './notification.controller';
import { IAdvertNotificationData } from './notification.interface';

function sendNotifications(users: IUser[], user_notification_data: IAdvertNotificationData): string {

    users.forEach(async (user) => {

        await send_notification_to_one_user(user_notification_data, user.device_token);

    })

    return 'Notifications sent successfully';
}

parentPort?.on('message', (data) => {
    const users: IUser[] = data.users
    const user_notification_data: IAdvertNotificationData = data.user_notification_data
    const result = sendNotifications(users, user_notification_data);

    parentPort?.postMessage(result);
});
