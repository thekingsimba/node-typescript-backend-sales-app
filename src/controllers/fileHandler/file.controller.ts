import { Request, Response } from "express";
import { success, error } from "../../config/response";
import { File } from "./interface";

export const fileUploader = async (req: Request, res: Response) => {

  try {
    let image_url: File = req.file;
    if (!image_url) return res.status(404).json(error("Request failed. Please try again", res.statusCode));
    return res.json(success("Success", image_url.location, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}