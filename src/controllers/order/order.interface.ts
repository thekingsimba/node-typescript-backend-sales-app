import { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  items?: IItem[];
  deliveryFee: number;
  serviceFee: number;
  userId: Schema.Types.ObjectId;
  status?: string;
  estimatedDeliveryTime: string;
  deliveryAddress: string;
  payment_status: string;
  payment_token: string;
  restaurantId: Schema.Types.ObjectId;
  grand_total: number;
  subtotal: number;
  reference_code: string;
  payment_verification_count: number;
  merchant_category: string;
  transaction_created: boolean;
  note: string;
  lat: number;
  long: number;
  status_time_tracker: { 
    status: string;
    time?: Date;
  }[];
  delivery_reference: string;
}

export interface IItem {
  name: string;
  foodPrice: number;
  extras: any;
  description: string;
  restaurantId: Schema.Types.ObjectId;
  foodId: Schema.Types.ObjectId;
  extra_cost: number;
  totalCost?: number;
  quantity: number;
  weight: number;
}

export interface Update {
  status: string;
  userId: Schema.Types.ObjectId;
  orderId: Schema.Types.ObjectId;
}