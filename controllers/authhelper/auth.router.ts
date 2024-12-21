import { Router } from "express";
import { forgotPassword, resetPassword } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/forgot_password", forgotPassword);
authRouter.post("/reset_password", resetPassword);
authRouter.post("/resend_code", forgotPassword);