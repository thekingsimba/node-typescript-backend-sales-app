import { User } from 'controllers/users/users.schema';
import { Expo } from 'expo-server-sdk';
import { Request, Response } from 'express';
import { Worker } from 'worker_threads';
import { error, success } from '../../config/response';
import { pagination } from '../../middleware/pagination';
import { admin } from '../../utils/firebase';
import Logger from '../../utils/logger';
import { IUser } from '../users/user.interface';
import { IAdvertNotificationData } from './notification.interface';
import { Notification } from './notification.schema';
import { getAllUserTokens } from 'controllers/users/users.controller';

export const send_notification_for_order = async (data: any) => {
  console.log(data)
  try {
    const message = {
      notification: {
        title: data.title,
        body: data.message,
      },
      data: {
        score: '850',
        time: '2:45',
        id: JSON.stringify(data.order && data.notification_id),
        order_id: JSON.stringify(data.order._id)
      },
      tokens: data.device_token, 
    }
    save_notification(data);
    admin.messaging().sendEachForMulticast(message)
      .then((response) => {
        console.log(response)
        Logger.info(`NOTIFICATION INFO LOG: ${JSON.stringify(response)}`)
      })
      .catch((error) => {
        Logger.error('Error sending multicast message:', error);
      });
  } catch (err: any) {
    Logger.error(`NOTIFICATION ERROR LOG: ${JSON.stringify(err)}`);
  }
}

export const send_notification_to_one_user = async (data: IAdvertNotificationData, user_device_token_list: string[]) => {
  // console.log(data)
  const { title, message, additional_info } = data
  try {
    const notification_message = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        score: '850',
        time: '2:45',
        additional_info: JSON.stringify(additional_info)
      },
      tokens: user_device_token_list,
    }
    save_notification(data);
    admin.messaging().sendEachForMulticast(notification_message)
      .then((response) => {
        Logger.info(`NOTIFICATION INFO LOG: ${JSON.stringify(response)}`)
        return { status: "SUCCESS", info: JSON.stringify(JSON.stringify(response)) }

      })
      .catch((error) => {
        Logger.error('Error sending multicast message:', error);
        return { status: "ERROR", info: JSON.stringify(error) }
      });
  } catch (err: any) {
    Logger.error(`NOTIFICATION ERROR LOG: ${JSON.stringify(err)}`);
    return { status: "ERROR", info: JSON.stringify(err) }
  }
}

export const expoNotification = async (data: any) => {
  try {
    let expo = new Expo({
      useFcmV1: false
    });
    let messages: any = [];
    for (let pushToken of data.device_token) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }
      messages.push({
        to: pushToken,
        sound: 'default',
        body: data.message,
        data: {
          score: '850',
          time: '2:45',
          id: JSON.stringify(data.order && data.notification_id),
          order_id: JSON.stringify(data.order._id)
        },
      })
    }
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  } catch (err: any) {
    console.log(err)
  }
}

export const send_message_to_topic = async (req: Request, res: Response) => {
  try {
    const { title, topic, image, icon, tokens, message } = req.body;

    const allUserToken = await getAllUserTokens();

    const concernedTokens = !tokens?.length ? extractDeviceTokens(allUserToken) : tokens;

    if (!concernedTokens.length) return res.status(404).json(error("Token list is empty", res.statusCode));

    const notificationPayload = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        title: title,
        message: message,
        image: image || '',
        topic: topic || '',
        icon: icon || ''
      },
      tokens: concernedTokens,
    };
    
    const response = await admin.messaging().sendEachForMulticast(notificationPayload);
    const successResponse = `${response.successCount} devices got the message. ${response.failureCount} registered devices was not found`
    Logger.info(JSON.stringify(response));
    return res.json(success("Success", successResponse, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return { error: "Failed to send send message"}
  }
}

function extractDeviceTokens(data: any[]) {
  const deviceTokens = new Set();

  data.forEach((token: any) => {
    deviceTokens.add(token);
  });

  return Array.from(deviceTokens);
}

export const save_notification = async (data: object) => {
  try {
    let notification = new Notification(data);
    notification = await notification.save();
  } catch (err: any) {
    Logger.log("error", JSON.stringify(err));
  }
}

export const notification_list = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const notification_list = await Notification.paginate({ "receiver.user_id": req.query.merchant_id }, { limit, offset, sort: { createdAt: -1 }});
    return res.json(success("Success", notification_list, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(`Error occured: ${err.message}`, res.statusCode));
  }
}

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.query.id);
    return res.json(success("Success", notification, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error(`Error occured: ${err.message}`, res.statusCode));
  }
}

export const update_status = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.query.id, { $set: { status: "opened" }}, { new: true });
    if (!notification)  return res.status(404).json(error("Record not found", res.statusCode));
    return res.json(success("Success", notification, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error(`Some thing went wrong. Please contact support for assistance.`, res.statusCode));
  }
}


export const notify_one_user = async (req: Request, res: Response) => {
  try {
    const { title, message, additional_info } = req.body;

    const user_notification_data = { title, message, additional_info }

    const user = await User.findById({ _id: req.query.user_id });

    if (!user) return res.status(404).json(error("User does not exist", res.statusCode));

    const feedback = await send_notification_to_one_user(user_notification_data, user.device_token);

    if (feedback.status === "SUCCESS") {
      return res.json(success("Success", feedback.info, res.statusCode));
    } else {
      return res.status(500).json(error(`Notification couldn't be sent. Info : ${feedback.info}`, res.statusCode))
    }

  } catch (err: any) {
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error(`Some thing went wrong. Please contact support for assistance.`, res.statusCode));
  }
}

export const notify_all_user = async (req: Request, res: Response) => {
  try {
    const { title, message, additional_info } = req.body;

    const user_notification_data = { title, message, additional_info }

    const users: IUser[] = await User.find({});;

    if (!users) return res.status(404).json(error("Empty user list fetched", res.statusCode));

    const worker = new Worker('./notification-for-all-users.worker.ts');

    worker.postMessage({ users, user_notification_data });


    worker.on('message', (result) => {
      Logger.info("Push notification sent successfully")
      // return res.json(success("Success", "Push notification sent successfully", res.statusCode));
    });

    worker.on('error', (error) => {
      Logger.error(JSON.stringify(error))
      // return res.status(500).json({ errorMessage: `Some thing went wrong. Please contact support for assistance.`, statusCode: res.statusCode });
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        Logger.error(JSON.stringify(error))
        // return res.status(500).json({ errorMessage: `Some thing went wrong. Please contact support for assistance. errorCode ${code}`, statusCode: res.statusCode });
      }
    });

    return res.json(success("Success", "Push notification ongoing", res.statusCode));

  } catch (err: any) {
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error(`Some thing went wrong. Please contact support for assistance.`, res.statusCode));
  }
}

export const socket_notification_list = async (data: any) => {
  try {
    const notification_list = await Notification.find({ "receiver.user_id": data.merchant_id }).sort({ createdAt: -1 });
    return { data: notification_list };
  } catch (err: any) {
    return { error: `Error occured: ${err.message}`};
  }
}