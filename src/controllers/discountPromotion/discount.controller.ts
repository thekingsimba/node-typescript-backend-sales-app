import { Discount } from "./discount.schema";
import { error, success } from "../../config/response";
import { Request, Response } from "express";
import { IDiscount } from "./discount.interface";
import Logger from "../../utils/logger";

export const createDiscount = async (req: Request, res: Response) => {
  try {
    const { percentage, discountType, city, code, name, isGeneral, expiryDate, amount, usage } = req.body;
    if (!percentage && !amount) return res.status(400).json(error("One of percentage or amount must be provided", res.statusCode));
    if (!discountType) return res.status(400).json(error("discountType must be provided", res.statusCode));
    if (!expiryDate) return res.status(400).json(error("Discount expiry date is required", res.statusCode));
    if (!city && isGeneral) return res.status(400).json(error("City or is general status is required", res.statusCode));
    if (!code) return res.status(400).json(error("Discount code is required", res.statusCode));
    const data: IDiscount = req.body;
    let discount = new Discount({
      percentage,
      discountType,
      city: data.city.toLowerCase(),
      code: data.code.toLowerCase(), 
      name: data.name.toLowerCase(), 
      isGeneral, 
      expiryDate,
      usage,
      amount
    });
    await discount.save()
    return res.json(success("Discount created!", discount, res.statusCode));
  } catch (err: any) {
    console.log(err)
    return res.status(500).json(error("Request failed. Please try again or contact support", res.statusCode));
  }
}

export const getDiscounts = async (req: Request, res: Response) => {
  try {
    const discount = await Discount.find({})
    return res.json(success("Success", discount, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Request failed. Please try again or contact support", res.statusCode));
  }
}

export const getDiscount = async (req: Request, res: Response) => {
  try {
    const discount = await Discount.findById(req.query.id)
    return res.json(success("Success", discount, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Request failed. Please try again or contact support", res.statusCode));
  }
}

export const add_user = async (data: any) => {
  try {
    const { email, coupon } = data;
    const updated_coupon = await Discount.findOneAndUpdate({ code: coupon.toLowerCase() }, { $push: { users: email }}, { new: true });
    Logger.info(JSON.stringify(updated_coupon));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
  }
}

export const verify_coupon_usage = async (data: any) => {
  try {
    const { email, coupon } = data;
    const result = await Discount.findOne({ code: coupon.toLowerCase(), users: email });
    if (result && result.usage.toLowerCase() === "single") return true; // has used the code
    return false; // has not used the code
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
  }
}

export const valid_coupon = async (data: any) => {
  try {
    let coupon = await Discount.findOne({ code: data.toLowerCase(), expiryDate: { $gt: new Date() }});
    if (coupon) return { data: coupon}; // still a valid code
    return { error: "No valid coupon found "+ data }
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
  }
}

export const validate_coupon = async (data: any) => {
  try {
    let coupon = await Discount.findOne({ code: data.toLowerCase(), expiryDate: { $gt: new Date() }});
    if (coupon) return true; // still a valid code
    return false; // expired code
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
  }
}

export const update_coupon = async (req: Request, res: Response) => {
  try {
    let coupon = await Discount.findByIdAndUpdate({ _id: req.body.id }, req.body, { new: true });
    if (!coupon) return res.status(400).json(error(`No discount offer exists with the ID: ${req.body.id}`, res.statusCode));
    Logger.info(JSON.stringify(coupon));
    return res.json(success("Discount updated", coupon, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
  }
}

export const delete_coupon = async (req: Request, res: Response) => {
  try {
    let coupon = await Discount.findByIdAndDelete({ _id: req.query.id });
    Logger.info(JSON.stringify(coupon));
    if (!coupon) return res.status(400).json(error(`No discount offer exists with the ID: ${req.body.id}`, res.statusCode));
    Logger.info(JSON.stringify(coupon));
    return res.json(success("Discount updated", coupon, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
  }
}