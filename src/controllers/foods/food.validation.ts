import { body, query, validationResult } from "express-validator";
import { validation } from "../../config/response";
import { NextFunction, Request, Response } from "express";

export const createValidator = [
  body("name").isString().withMessage("Name field must be a string"),
  body("name").notEmpty().withMessage("Name is required"),
  body("image_url").notEmpty().withMessage("Food photo is required"),
  body("description").notEmpty().withMessage("Description is missing"),
  body("price").isNumeric().withMessage("Invalid food price"),
  body("category").isMongoId().withMessage("Invalid food category"),
  body("restaurant").isMongoId().withMessage("Invalid merchant ID"),
  body("estimatedPrepTime").notEmpty().withMessage("Estimated preparation time is required"),
  body("taxRate").notEmpty().withMessage("Tax rate is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]


export const publishValidator = [
  body("restaurantID").isMongoId().withMessage("Invalid merchant ID"),
  body("foodID").isMongoId().withMessage("Invalid food ID"),
  body("published").notEmpty().withMessage("Publish status is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]


export const listValidator = [
  query("page").isInt().withMessage("Page number is missing in query"),
  query("limit").isInt().withMessage("Item limit is missing in query"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const merchantFoodValidator = [
  query("page").isInt().withMessage("Page number is missing in query"),
  query("limit").isInt().withMessage("Item limit is missing in query"),
  query("restaurant").isMongoId().withMessage("Invalid merchant ID"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]

export const queryValidator = [
  query("id").isMongoId().withMessage("Invalid food ID"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json(validation(errors.array()));
    next();
  }
]
