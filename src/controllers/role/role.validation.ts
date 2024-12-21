import { body, query, validationResult } from "express-validator";
import { validation } from "../../config/response";
import { NextFunction, Request, Response } from "express";

export const create_validator = [
  body("name").notEmpty().isString().withMessage("Invalid role name"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const list_validator = [
  query("page").notEmpty().isString().withMessage("Invalid query param: page"),
  query("limit").notEmpty().isString().withMessage("Invalid query param: limit"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const detail_validator = [
  query("id").notEmpty().isString().withMessage("Invalid query param: id"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const update_validator = [
  body("name").notEmpty().isString().withMessage("Invalid role name"),
  body("id").notEmpty().isString().withMessage("Invalid role id"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const add_permission_validator = [
  body("role_id").isMongoId().withMessage("Invalid role ID"),
  body("permissions").isArray({ min: 1 }).withMessage("Invalid value. Permissions must be an array"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next(); 
  }
]