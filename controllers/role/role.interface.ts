import { Document, Schema } from "mongoose";

export interface IRole extends Document {
  name: string;
  permissions: {
    name: String,
    _id: Schema.Types.ObjectId
  }[];
}

export interface IRolePermission {
  role_id: Schema.Types.ObjectId;
  permissions: Schema.Types.ObjectId[];
}

export interface IRoleCreate {
  name: IRole["name"]
}