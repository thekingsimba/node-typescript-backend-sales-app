import { model, Schema, PaginateModel, Document } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IPermission } from "./permission.interface";

const permissionSchema: Schema = new Schema({
  name: { type: String }
}, { timestamps: true, toJSON: {
  transform(doc, ret, options) {
    delete ret.__v
  },
}});

permissionSchema.index({ _id: 1, name: 1});
permissionSchema.plugin(mongoosePaginate);
interface PermissionModel<T extends Document> extends PaginateModel<T> {}
export const Permission: PermissionModel<IPermission> = model<IPermission>("Permission", permissionSchema) as PermissionModel<any>;