import mongoose, { Schema } from "mongoose";
import { IRole } from "./role.interface";

const roleSchema: Schema = new Schema({
  name: { type: String },
  permissions: [{
    name: String,
    _id: { type: Schema.Types.ObjectId, ref: "Permission" }
  }]
}, { timestamps: true });

roleSchema.index({ _id: 1, name: 1, "permissions.name": 1 });
export const Role = mongoose.model<IRole>("Role", roleSchema);