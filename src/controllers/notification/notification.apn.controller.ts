import apn from "apn"
import fs from "fs";
import Logger from "../../utils/logger";
import path from "path";

require("dotenv").config({ path: path.resolve(__dirname + "/../../../.env") });

// const apn = require('apn');

const apnProvider = new apn.Provider({
  token: {
    key: path.resolve(__dirname + "/notification.p8"),
    keyId: process.env.NOTIF_APN_PROVIDER_KEY_ID,
    teamId: process.env.NOTIF_APN_PROVIDER_TEAM_ID
  },
  production: false // Set to true for production environment
});	  

export const apple_notification = async (data: any) => {
  const notification = new apn.Notification({
    alert: {
      title: data.title,
      body: data.message
    },
    sound: 'notifsound.wav',
    topic: process.env.MERCHANT_APPLE_NOTIFICATION_TOPIC,
  });
  const device_tokens = data.device_token
  try {
    const results = await Promise.all(
      device_tokens.map((token: string) => apnProvider.send(notification, token))
    );

    results.forEach(result => {
      if (result.failed.length > 0) {
        Logger.error(`${JSON.stringify(result.failed)}`)
      }
      if (result.sent.length > 0) {
        Logger.error(`${JSON.stringify(result.failed)}`);
      }
    });
  } catch (err) {
    console.error('Error sending notifications:', err);
    Logger.error(`Error sending notifications: ${JSON.stringify(err)}`)
  }
}

