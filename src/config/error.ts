import { Request, Response } from "express";
import Logger from "../utils/logger";

export default (err: any, req: Request, res: Response, next: any) => {
  Logger.error(err.message);

  res.status(500).json( err.message );
}