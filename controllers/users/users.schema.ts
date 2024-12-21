import { Schema, model, Document, PaginateModel } from "mongoose";
import { IUser } from "./user.interface";
import mongoosePaginate from "mongoose-paginate-v2";

const userSchema: Schema = new Schema({
  address: {
    first_line: { type: String },
    post_code: { type: String },
    city: { type: String },
    country: { type: String },
  },
  full_name: { type: String },
  email: { type: String },
  phone: { type: String },
  picture: { type: String },
  password: { type: String },
  verification_code: { type: String, },
  otp_expires: { type: Date },
  phone_verified: { type: Boolean, default: false },
  role: { type: Schema.Types.ObjectId, ref: "Role" },
  reset_password_otp: { type: Number },
  resetPasswordExpires: { type: Date },
  last_order_date: { type: Date },
  stripe_id: { type: String },
  device_token: [{ type: String }],
  firebase_token: { type: String },
  login_type: { type: String, enum: ["google_auth", "apple_auth", "email_auth"] }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret.password;
      delete ret.__v;
    }
  }
});

userSchema.plugin(mongoosePaginate);
userSchema.index({ _id: 1, login_type: 1, phone: 1, email: 1, "address.city": 1, full_name: 1, })

interface UserModel<T extends Document> extends PaginateModel<T> {}
export const User: UserModel<IUser> = model<IUser>("User", userSchema) as UserModel<any>;