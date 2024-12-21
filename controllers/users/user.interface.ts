import { Document, Schema } from "mongoose";

export interface IUser extends Document {
  address: {
    first_line: string;
    city: string;
    post_code: string;
    country: string;
  };
  full_name: string;
  email: string;
  phone?: string;
  picture: string;
  password: string;
  verification_code: string;
  phone_verified: boolean;
  otp_expires: Date;
  role?: Schema.Types.ObjectId;
  reset_password_otp: number;
  resetPasswordExpires: Date;
  device_token: string[];
  last_order_date: Date;
  stripe_id: string;
  firebase_token: string;
  login_type: string;
}

export interface IUserCreate {
  full_name: IUser["full_name"];
  email: IUser["email"];
  phone: IUser["phone"];
  picture?: IUser["picture"];
  password?: IUser["password"];
  address?: IUser["address"];
  firebase_token?: IUser["firebase_token"];
  login_type?: IUser["login_type"];
}

export interface IAddress {
  post_code: string;
  country: string;
  city: string;
  first_line: string;
  user_id: Schema.Types.ObjectId;
}