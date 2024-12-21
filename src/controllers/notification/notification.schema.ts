import { model, Schema, PaginateModel, Document } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { INotification } from "./notification.interface";

const notificationSchema: Schema = new Schema({
  title: { type: String },
  message: { type: String },
  receiver: {
    user_id: { type: Schema.Types.ObjectId },
    first_name: { type: String },
    last_name: { type: String },
    phone_number: { type: String }
  },
  order_id: { type: Schema.Types.ObjectId, ref: "Order" },
  image: { type: String },
  notification_id: { type: Number },
  status: { type: String, enum: ["new", "opened" ], default: "new" },
}, { 
  timestamps: true,
  toJSON: {
    transform: ((doc, ret) => {
      delete ret.__v
    })
  }
});

notificationSchema.index({ _id: 1, title: 1, message: 1 });
notificationSchema.plugin(mongoosePaginate);
interface NotificationModel<T extends Document> extends PaginateModel<T> {}
export const Notification: NotificationModel<INotification> = model<INotification>("Notification", notificationSchema) as NotificationModel<any>;