import { validationResult, body,  } from "express-validator";
import { validation } from "../../config/response";
import { Request, Response, NextFunction } from "express";

export const add_to_cart_validation = [
  body("merchant_id").notEmpty().isMongoId().withMessage("Invalid merchant ID"),
  body("food_id").notEmpty().isMongoId().withMessage("Please select a food"),
  body("quantity").notEmpty().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json(validation(errors.array()));
    next();
  }
]