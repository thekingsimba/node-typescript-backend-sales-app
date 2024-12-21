import { Router } from "express";
import { verifyUser } from "../../middleware/auth";
import { upload } from "../../middleware/file_uploader";
import { fileUploader } from "./file.controller";

export const fileRouter = Router();

fileRouter.post("/upload", upload.single("file"), fileUploader);