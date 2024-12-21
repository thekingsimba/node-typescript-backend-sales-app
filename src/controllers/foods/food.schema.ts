import { Document, model, PaginateModel, Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import { IFood } from './interface';

const foodSchema: Schema = new Schema({
  name: { type: String },
  image_url: { type: String },
  description: { type: String },
  price: { type: Number },
  category: { type: Schema.Types.ObjectId, ref: "Category" },
  restaurant: { type: Schema.Types.ObjectId, ref: "Merchant" },
  extras: [{ type: Schema.Types.ObjectId, ref: "Extra" }],
  extrasCategory: [{ type: Schema.Types.ObjectId, ref: "ExtraCategory" }],
  estimatedPrepTime: { type: String },
  taxRate: { type: String },
  ratings: [{ 
    userId: { type: Schema.Types.ObjectId },
    rate: { type: Number },
    review: { type: String },
    foodId: { type: Schema.Types.ObjectId },
  }],
  published: { type: Boolean, default: false },
  unit: { type: String, default: "plate" },
  weight: { type: Number, default: 0 },
}, { timestamps: true });

foodSchema.index({ _id: 1, name: 1, description: 1, price: 1, restaurant: 1, category: 1 })
foodSchema.plugin(mongoosePaginate);
interface FoodModel<T extends Document> extends PaginateModel<T> {}
export const Food: FoodModel<IFood> = model<IFood>("Food", foodSchema) as FoodModel<any>;