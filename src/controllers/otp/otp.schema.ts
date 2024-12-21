import { Schema, model } from "mongoose";

const otpSchema: Schema = new Schema({
  verification_code: { type: String, },
  otp_expires: { type: Date },
}, { timestamps: true });

export const OTP = model("OTP", otpSchema);