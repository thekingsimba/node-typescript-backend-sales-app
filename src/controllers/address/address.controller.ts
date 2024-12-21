import { Request, Response } from "express";
import { DeliveryAddress } from "./address.schema";
import { error, success } from "../../config/response";
import { IAddress } from "./address.interface";

export const createAddress = async (req: Request, res: Response) => {
  try {
    const data: IAddress = req.body;
    const addressExists = await DeliveryAddress.findOne({ address: data.address, user: data.user });
    if (!addressExists) {
      let newAddress = new DeliveryAddress({ address: data.address, user: data.user });
      await newAddress.save();
      return res.json(success("Success", newAddress, res.statusCode));
    }
    return res.json(success("Success", addressExists, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Internal Server Error. Please try again later.", res.statusCode));
  }
}

export const deliveryAddressList = async (req: Request, res: Response) => {
  try {
    if (!req.query.user) return res.status(400).json(error("Request param: user is missing in query", res.statusCode));
    const addresses = await DeliveryAddress.find({ user: req.query.user });
    return res.json(success("Success", addresses, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Internal Server Error. Please try again later.", res.statusCode));
  }
}