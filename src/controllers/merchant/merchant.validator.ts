import { body, query, validationResult } from "express-validator";
import { validation } from "../../config/response";
import { NextFunction, Request, Response } from "express";

export const getRatingValidator = [
  query("name").notEmpty().withMessage("Merchant name is require"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const ratingValidator = [
  body("userId").isMongoId().withMessage("Invalid user ID"),
  body("merchantId").isMongoId().withMessage("Invalid merchant ID"),
  body("rate").notEmpty().withMessage("Rating value is required"),
  body("rate").isInt().withMessage("Invalid rating value"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const permissionValidator = [
  body("merchantId").isMongoId().withMessage("Invalid merchant ID"),
  body("permissions").notEmpty().isArray().withMessage("Invalid merchant ID"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const statusValidator = [
  body("merchant_id").isMongoId().withMessage("Invalid merchant ID"),
  body("status").notEmpty().isIn(["open", "closed"]).withMessage("Invalid status"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const open_close_time_validation = [
  body("opening_time").notEmpty().withMessage("Shop opening time is required"),
  body("opening_time").isString().withMessage("Invalid opening time"),
  body("closing_time").isString().withMessage("Invalid closing time"),
  body("closing_time").notEmpty().withMessage("shop closing time is required"),
  body("day").isString().withMessage("Invalid day parameter"),
  body("day").isIn(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]).withMessage("Invalid day parameter"),
  body("day").notEmpty().withMessage("Opening day is required"),
  body("status").isIn(["open", "closed"]).withMessage("Invalid store opening and closing time status"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]