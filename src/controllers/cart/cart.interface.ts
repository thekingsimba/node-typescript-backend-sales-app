import { Document, Schema } from 'mongoose';

export interface ICart extends Document {
  merchants: {
    stripe_id?: string;
    location: {
      type: string,
      coordinates: object;
    },
    merchant_id: Schema.Types.ObjectId;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    restaurant_name: string;
    address: {
      line_1: string;
      line_2: string;
      post_code: string;
      country: string;
    };
    items: {
      name: string;
      foodPrice: number;
      image: string;
      extras?: Schema.Types.ObjectId[];
      description?: string;
      restaurantId: Schema.Types.ObjectId;
      foodId: Schema.Types.ObjectId;
      extra_cost?: number;
      totalPrice: number;
      quantity: number;
      weight: number;
      _id?: Schema.Types.ObjectId;
    }[]
    merchantTotal: number;
  }[],
  totalItems: number;
  totalCost: number;
  note: string;
}

export interface ICartData {
  cart_id?: Schema.Types.ObjectId;
  merchant_id: ICart["merchants"][0]["merchant_id"];
  extras: ICart["merchants"][0]["items"][0]["extras"];
  food_id: ICart["merchants"][0]["items"][0]["foodId"];
  quantity: ICart["merchants"][0]["items"][0]["quantity"];
}[]