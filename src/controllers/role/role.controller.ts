import { Role } from "./role.schema";
import { success, error } from "../../config/response";
import { Request, Response } from "express";
import { IRoleCreate, IRolePermission } from "./role.interface";
import Logger from "../../utils/logger";
import { paginated_data } from "../../middleware/pagination";
import { Permission } from "../permission/permission.schema";

export const create = async (req: Request, res: Response) => {
  try {
    const data: IRoleCreate = req.body;
    const existingRole = await Role.findOne({ name: data.name });
    if (existingRole) return res.status(400).json(error("Role name already exists", res.statusCode));
    let newRole = new Role(data);
    newRole = await newRole.save();
    return res.json(success("Success", newRole, res.statusCode));
  } catch (err: any) {
    Logger.error(`ROLE CREATION ERROR LOGS: ${err}`)
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const getRoles = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const roles = await Role.find({}).populate("permissions");
    if (roles.length === 0) return res.status(404).json(error("No records found", res.statusCode));
    const result = paginated_data(roles, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    Logger.error(`ROLE LIST ERROR LOGS: ${err}`);
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const getClientRoles = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const roles = await Role.find({ name: { $nin: ["super admin", "admin"] } }).populate("permissions");
    const result = paginated_data(roles, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const addPermissions = async (req: Request, res: Response) => {
  try {
    const { role_id, permissions }: IRolePermission = req.body;
    let role
    const roleExists = await Role.findById(role_id);
    if (!roleExists) return res.status(404).json(error("Role not found", res.statusCode));
    for (let permission of permissions) {
      const permissionExists = await Permission.findById(permission);
      if (!permissionExists) return res.status(404).json(error(`Permission with ID: ${permission} not found`, res.statusCode));
      const perm_filter = roleExists?.permissions.filter(p => p._id.toString() === permission.toString())
      if (perm_filter.length === 0) {
        const data = {
          name: permissionExists.name,
          _id: permissionExists._id
        }
        role = await Role.findByIdAndUpdate(role_id, { $push: { permissions: data } }, { new: true });
      } else {
        return res.status(400).json(error(`Permission: ${permissionExists?.name}, already exists in ${roleExists?.name}`, res.statusCode));
      }
    }
    return res.json(success("Success", role, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const getRole = async (req: Request, res: Response) => {
  try {
    const role = await Role.findById({ _id: req.query.id });
    return res.json(success("Success", role, res.statusCode));
  } catch (err: any) {
    Logger.error(`ROLE LIST ERROR LOGS: ${err}`);
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const updateRole = async (req: Request, res: Response) => {
  try {
    const role = await Role.findByIdAndUpdate({ _id: req.body.id }, req.body, { new: true });
    if (!role) return res.status(404).json(error("No records found", res.statusCode));
    return res.json(success("Success", role, res.statusCode));
  } catch (err: any) {
    Logger.error(`ROLE LIST ERROR LOGS: ${err}`);
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    const role = await Role.findByIdAndDelete({ _id: id });
    if (!role) return res.status(404).json(error("No records found", res.statusCode));
    return res.json(success("Success", role, res.statusCode));
  } catch (err: any) {
    Logger.error(`ROLE LIST ERROR LOGS: ${err}`);
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}