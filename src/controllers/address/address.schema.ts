import mongoose, { Schema, model } from "mongoose";

const deliveryAddressSchema: Schema = new Schema({
  address: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User"}
}, { timestamps: true });

deliveryAddressSchema.index({ _id: 1, address: 1, user: 1 });
export const DeliveryAddress = model("DeliveryAddress", deliveryAddressSchema);