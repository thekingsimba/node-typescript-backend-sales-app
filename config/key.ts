import path from "path";
require("dotenv").config({ path: path.resolve(__dirname + "/../../.env")});

export default {
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DATABASE: process.env.DATABASE,
  DB_PASSWORD: process.env.DB_PASSWORD,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_SECRET: process.env.FACEBOOK_SECRET,
  SECRET: process.env.SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  QRCODE_BUCKET: process.env.QRCODE_BUCKET,
  IPADDRESS_LOGS: process.env.IPADDRESS_LOGS,
  TWILIO_SID: process.env.TWILIO_SID,
  TWILIO_SECRETE: process.env.TWILIO_SECRET,
  TWILIO_AUTH_TOKNE: process.env.TWILIO_AUTH_TOKEN,
  SMS_FROM_NUMBER: process.env.SMS_FROM_NUMBER,
  STRIPE_KEY: process.env.STRIPE_KEY,
  STRIPE_BASE_URL: process.env.STRIPE_BASE_URL,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  MERCHANT_APP_URL: process.env.MERCHANT_APP_URL,
}