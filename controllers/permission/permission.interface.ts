import { Document } from "mongoose";

export interface IPermission extends Document {
  name: string;
}

export interface IPermissionCreate {
  name: IPermission["name"];
}