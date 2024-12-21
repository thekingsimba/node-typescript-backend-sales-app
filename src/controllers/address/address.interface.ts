import { Document, Schema } from "mongoose";

export interface IAddress extends Document {
  address: string;
  user: Schema.Types.ObjectId;
}