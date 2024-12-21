import { Schema, Document } from "mongoose";

export interface IDiscount extends Document {
  percentage: number;
  city: string;
  discountType: string;
  amount: number;
  code: string;
  name: string;
  users: string[];
  usage: string;
  isGeneral: boolean;
  expiryDate: Date;
}