import mongoose, { Schema } from 'mongoose';

import { ICart } from './cart.interface';

const cartSchema: Schema = new Schema({
  merchants: [{
    location: {
      type: { type: String, enum: ["Point"], default: "Point", required: true },
      coordinates: [ Number ]
    },
    stripe_id: { type: String, default: "" },
    merchant_id: { type: Schema.Types.ObjectId, ref: "Merchant" },
    first_name: { type: String, },
    last_name: { type: String },
    email: { type: String },
    phone_number: { type: String },
    restaurant_name: { type: String },
    address: {
      line_1: { type: String },
      line_2: { type: String },
      city: { type: String },
      post_code: { type: String },
      country: { type: String }
    },
    items: [{
      name: { type: String },
      foodPrice: { type: Number },
      image: { type: String },
      extra_cost: { type: Number },
      extras: [{ type: Schema.Types.ObjectId, ref: "Extra" }],
      description: { type: String },
      restaurantId: { type: Schema.Types.ObjectId, ref: "Merchant" },
      totalPrice: { type: Number, default: 0 },
      foodId: { type: Schema.Types.ObjectId, ref: "Food" },
      quantity: { type: Number },
      weight: { type: Number, default: 0.5 },
    }],
    merchantTotal: { type: Number, default: 0 },
  }],
  totalItems: { type: Number },
  totalCost: { type: Number, default: 0 },
  note: { type: String },
}, { timestamps: true });

export const Cart = mongoose.model<ICart>("Cart", cartSchema);