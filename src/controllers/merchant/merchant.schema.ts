import { Schema, Document, PaginateModel, model, now } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IMerchant } from "./merchant.interface";

const merchantSchema: Schema = new Schema({
  first_name: { type: String, },
  last_name: { type: String },
  email: { type: String },
  phone_number: { type: String },
  password: { type: String },
  restaurant_name: { type: String },
  food_category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  status: { type: String, enum: [ "open", "closed" ], default: "closed" },
  manually_closed: { type: Boolean, default: false },
  verification_status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  address: {
    line_1: { type: String },
    line_2: { type: String },
    post_code: { type: String },
    country: { type: String }
  },
  bank_details: {
    sort_code: { type: String },
    account_number: { type: String },
    account_name: { type: String },
    bank_name: { type: String },
  },
  discount_amount: { type: Number, default: 0 },
  location: {
    type: { type: String, enum: ["Point"], default: "Point", required: true },
    coordinates: [ Number ]
  },
  about: { type: String, default: "" },
  customer_note: { type: String, default: "" },
  last_status_update_at: { type: Date },
  image_url: { type: String, default: "" },
  ratings: [{ 
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    rate: { type: Number, default: 0 },
    foodId: { type: Schema.Types.ObjectId, ref: "Food" },
    review: { type: String },
    date: { type: Date, default: new Date() }
  }],
  averageRating: { type: Number, default: 0 },
  totalRating: { type: Number, default: 0 },
  banner_image: { type: String, default: "" },
  fhr_image: {
    image: { type: String, default: "" },
    last_updatedAt: { type: Date },
    rating: { type: Number },
  },
  special_offer: {
    amount: { type: Number, default: 0 },
    has_offer: { type: Boolean, default: false }
  },
  merchant_type: { type: Schema.Types.ObjectId, ref: "MerchantType" },
  slug: { type: String },
  role: { 
    role_id: { type: Schema.Types.ObjectId, ref: "Role" },
    role_name: { type: String }
  },

  open_close_time: [{
    day: { type: String },
    opening_time: { type: String },
    closing_time: { type: String },
    status: { type: String, enum: ["open", "closed"], default: "closed" },
  }],
  reset_password_otp: { type: Number },
  resetPasswordExpires: { type: Date },
  live_order_notification: { type: Boolean, default: false },
  promotion_notification: { type: Boolean, default: false },
  device_token: [{ type: String }],
  stripe_account_id: { type: String },
  email_verified: { type: Boolean, default: false },
  connect_account_status: { type: String, enum: [ "pending", "complete" ], default: "pending" },
  fsa_inspection_certificate: { type: String, default: "" },
  fsa_fhr_image: { type: String, default: "" },
  fsa_current_rating_written: { type: Number, default: 0 },
  fsa_last_updated_date: { type: Date },
  fsa_awaiting_inspection_doc: { type: String, default: "" },
  fsa_scheduled_inspection_date: { type: Date },
  store_link: { type: String },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.password;
      delete ret.__v;
    }
  }
});

merchantSchema.index({ 
  location: "2dsphere", 
  _id: 1,  
  first_name: 1, 
  last_name:1,
  email:1,
  phone_number:1,
  password:1,
  restaurant_name: 1,
  status: 1,
  verification_status: 1
});
merchantSchema.plugin(mongoosePaginate);
interface MerchantModel<T extends Document> extends PaginateModel<T> {}
export const Merchant: MerchantModel<IMerchant> = model<IMerchant>("Merchant", merchantSchema) as MerchantModel<any>;