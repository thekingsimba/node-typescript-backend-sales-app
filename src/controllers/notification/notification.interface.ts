import { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  receiver: {
    user_id: Schema.Types.ObjectId;
    first_name: string;
    last_name: string;
    phone_number: string;
  },
  order_id: Schema.Types.ObjectId;
  notification_id: number;
  status: string;
}
export interface IAdvertNotificationData {
  title: string;
  message: string;
  additional_info: string;
}