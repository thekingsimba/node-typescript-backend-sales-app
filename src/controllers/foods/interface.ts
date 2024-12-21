import { Document, Schema } from 'mongoose';

export interface IFood extends Document {
  name: string;
  image_url: string;
  description: string;
  price: number;
  extras: Schema.Types.ObjectId[];
  extraCategory: Schema.Types.ObjectId[],
  category: Schema.Types.ObjectId;
  restaurant: Schema.Types.ObjectId;
  estimatedPrepTime: string;
  taxRate: string;
  published?: boolean;
  unit: string;
  weight?: number;
}

export interface IPublish {
  restaurantID: IFood["restaurant"];
  foodID: string;
  published: IFood["published"];
}
