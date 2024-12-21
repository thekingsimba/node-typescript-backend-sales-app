import { Document, model, PaginateModel, Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import { IOrder } from './order.interface';

let orderSchema: Schema = new Schema({
  items: [{
    name: { type: String },
    foodPrice: { type: Number },
    extra_cost: { type: Number },
    extras: [{ type: Schema.Types.ObjectId, ref: "Extra" }],
    description: { type: String },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Merchant" },
    totalCost: { type: Number },
    foodId: { type: Schema.Types.ObjectId, ref: "Food" },
    quantity: { type: Number },
    weight: { type: Number, default: 0 },
  }],
  lat: { type: Number },
  long: { type: Number },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  deliveryAddress: { type: String },
  deliveryFee: { type: Number },
  serviceFee: { type: Number },
  estimatedDeliveryTime: { type: String },
  status: { type: String, enum: [ "new", "accepted", "cancelled", "rejected", "pickedup", "processing", "accepted", "arrived_at_pickup", "arrived_at_dropoff", "enroute pickup", "in transit", "delivered" ], default: "new" },
  payment_status: { type: String, enum: [ "pending", "successful", "failed" ], default: "pending" },
  payment_token: { type: String },
  subtotal: { type: Number },
  grand_total: { type: Number },
  merchant_remittance_status: { type: String, enum: ["pending", "paid", "failed" ], default: "pending" },
  reference_code: { type: String },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Merchant" },
  payment_verification_count: { type: Number, default: 0 },
  merchant_category: { type: String },
  transaction_created: { type: Boolean, default: false },
  note: { type: String },
  status_time_tracker: [{ 
    status: { type: String },
    time: { type: Date, default: Date.now }
  }],
  delivery_reference: { type: String },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
    }
  } 
});

orderSchema.plugin(mongoosePaginate);
orderSchema.index({_id: 1, deliveryAddress: 1, restaurantId: 1, reference_code: 1, status: 1, "items.name": 1, "items.description": 1 });

interface OrderModel<T extends Document> extends PaginateModel<T> {}
export const Order: OrderModel<IOrder> = model<IOrder>("Order", orderSchema) as OrderModel<any>;