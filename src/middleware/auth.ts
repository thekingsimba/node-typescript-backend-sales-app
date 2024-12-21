import { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import key from "../config/key";
import { Request, Response, NextFunction } from "express";
import { error } from "../config/response";
import { Role } from "../controllers/role/role.schema";
import Logger from "../utils/logger";

interface MyUser {
  user: { 
    _id: Schema.Types.ObjectId;
    email: string;
    role: Schema.Types.ObjectId;
  };
  iat: number;
  exp: number;
}

interface IPermission {
  name: string;
  _id: Schema.Types.ObjectId;
}

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.header("authorization");
    if (!token) return res.status(403).json(error("Access denied. No token provided", res.statusCode));
    token = token.split(" ")[1];
    const decoded: MyUser | any = jwt.verify(token, key.SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json(error("Invalid login token", res.statusCode));
  }
}

export const grantAccess = (resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req?.user) {
        if ("role" in req.user) {
          const role = await Role.findById(req.user["role"]).populate("permissions");
          const permissions = role?.permissions;
          for (let permission of permissions) {
            const perm = permission?.name;
            const split_name = perm.split(" ")[0];
            if (split_name.toLowerCase() === "allow" && perm.includes(resource)) { 
              return next();
            }
          }
          return res.status(403).json(error("You don't have permission for this request", res.statusCode));
        } else {
          return res.status(403).json(error("You don't have permission for this request", res.statusCode));
        }
      }
    } catch (err: any) {
      next(error);
      Logger.error(JSON.stringify(err));
    }
  }
}