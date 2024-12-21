import { validation } from "../../config/response";
import { NextFunction, Request, Response } from "express";
import { body, validationResult} from "express-validator";

export const social_create_validation = [
  body("full_name").notEmpty().isString().withMessage("Your full name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("phone").isMobilePhone("en-GB").withMessage("Invalid phone number"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(validation(errors.array()));
    next();
  }
]

export const email_create_validation = [
  body("full_name").notEmpty().isString().withMessage("Your full name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("phone").isMobilePhone("en-GB").withMessage("Invalid phone number"),
  body("password").isStrongPassword({ minLength: 8, minLowercase: 1, minNumbers: 1, minSymbols: 1, minUppercase: 1 }).withMessage("Invalid password"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(validation(errors.array()));
    next();
  }
]

export const email_login_validation = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(validation(errors.array()));
    next();
  }
]