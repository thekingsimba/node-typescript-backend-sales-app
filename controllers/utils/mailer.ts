import sgMail from '@sendgrid/mail';
import key from "../config/key";
import Logger from './logger';

sgMail.setApiKey(key.SENDGRID_API_KEY);

export const sendEmail = async (data: any) => {
  try {
    const response = await sgMail.send(data);
    if (response) Logger.info(`Email sent: ${response[0].statusCode} ${response[0].headers.date}`);
  } catch (err: any) {
    Logger.error(JSON.stringify(err))
  }
}