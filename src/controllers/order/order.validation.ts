import { check, body, validationResult, param, query } from "express-validator";
import { validation } from "../../config/response";
import { NextFunction, Request, Response } from "express";

export const createValidator = [
  body("cart_id").notEmpty().isMongoId().withMessage("Cart id is required"),
  // body("restaurantId").isMongoId().withMessage("Invalid restaurant ID"),
  body("userId").isMongoId().withMessage("Invalid restaurant ID"),
  body("deliveryFee").isFloat().withMessage("Invalid delivery fee"),
  body("serviceFee").isFloat().withMessage("Invalid service fee"),
  body("estimatedDeliveryTime").notEmpty().isFloat().withMessage("Estimated delivery time is required"),
  // body("transaction_reference").notEmpty().isString().withMessage("Transaction Reference is required"),
  body("subtotal").notEmpty().isFloat().withMessage("Subtotal is required"),
  body("payment_token").notEmpty().isString().withMessage("Strip payment token is required"),
  body("grandTotal").notEmpty().isFloat().withMessage("Invalid transaction grand total"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const orderListValidator = [
  query("page").isString().notEmpty().withMessage("Query parameter PAGE is missing"),
  query("limit").isMongoId().withMessage("Query parameter LIMIT is missing"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const retaurantOrderListValidator = [
  query("page").isString().notEmpty().withMessage("Query parameter PAGE is missing"),
  query("limit").isString().notEmpty().withMessage("Query parameter LIMIT is missing"),
  query("restaurantId").isMongoId().withMessage("Query parameter RESTAURANT ID is missing"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const update_order_status_validator = [
  body("orderId").notEmpty().isMongoId().withMessage("Order ID is required"),
  body("status").notEmpty().isIn(["accepted", "cancelled", "rejected", "processing", "processed", "pickedup", "delivered"]).withMessage("Invalid status"),
  body("userId").notEmpty().isMongoId().withMessage("Customer ID is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const cancel_order_status_validator = [
  body("order_id").notEmpty().isMongoId().withMessage("Order ID is required"),
  body("user_id").notEmpty().isMongoId().withMessage("Customer ID is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]