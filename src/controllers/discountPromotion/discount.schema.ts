import mongoose, { Schema } from "mongoose";
import { IDiscount } from "./discount.interface";

const discountSchema: Schema = new Schema({
  percentage: { type: Number },
  amount: { type: Number },
  discountType: { type: String, enum: ["percentage", "amount"] },
  city: { type: String },
  code: { type: String },
  name: { type: String },
  users: [{ type: String, unique: true }],
  isGeneral: { type: Boolean, default: false },
  expiryDate: { type: Date },
  usage: { type: String, enum: ["single", "multiple"] }
}, { timestamps: true });

discountSchema.index({ _id: 1, city: 1, restaurant: 1 });
export const Discount = mongoose.model<IDiscount>("Discount", discountSchema);