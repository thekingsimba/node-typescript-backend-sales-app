import { Request, Response } from "express";
import { Permission } from "./permission.schema";
import { IPermissionCreate } from "./permission.interface";
import { error, success } from "../../config/response";
import { pagination } from "../../middleware/pagination";
import Logger from "../../utils/logger";

export const create = async (req: Request, res: Response) => {
  try {
    const data: IPermissionCreate = req.body
    const permissionExists = await Permission.find({});
    let indexOf: any;
    if (permissionExists.length > 0) {
      const spreadPermission = [...permissionExists]
      indexOf = spreadPermission.findIndex(p => p?.name.toLowerCase() === data.name.toLowerCase());
    }
    console.log(indexOf, " the index of permission")
    if (indexOf >= 0) return res.status(400).json(error("Permission already exists", res.statusCode));
    let permission = new Permission(data);
    permission = await permission.save();
    return res.json(success("Success", permission, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const permissionList = async (req: Request, res: Response) => {
  try {
    const permissions = await Permission.find({});
    return res.json(success("Success", permissions, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const permissionDetails = async (req: Request, res: Response) => {
  try {
    const permission = await Permission.findById(req.query.id);
    return res.json(success("Success", permission, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const updatePermission = async (req: Request, res: Response) => {
  try {
    const permission = await Permission.findByIdAndUpdate(req.body.id, req.body, { new: true });
    return res.json(success("Success", permission, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const adminPermissionList = async (req: Request, res: Response) => {
  try {
    const { offset, limit }  = pagination(req.query);
    const permissions = await Permission.paginate({}, { offset, limit });
    return res.json(success("Success", permissions, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const deletePermission = async (req: Request, res: Response) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.query.id);
    return res.json(success("Success", permission, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const searchPermission = async (req: Request, res: Response) => {
  try {
    const searchResult = await Permission.find({ $or: [
      {
        name: {
          $regex: req.query.search_term,
          $options: "i"
        }
      }
    ]}).sort("name")
    return res.json(success("Success", searchResult, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}