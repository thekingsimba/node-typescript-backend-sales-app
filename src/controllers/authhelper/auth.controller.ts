import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { sendEmail } from "../../utils/mailer";
import { otp_code } from "../../utils/code_gen";
import { Merchant } from "../merchant/merchant.schema";
import { User } from "../users/users.schema";
import { error, success } from "../../config/response";
import { dynamic_template_data } from "../../utils/template";
import Logger from "../../utils/logger";

export const forgotPassword = async (req: Request, res: Response) => {
  const { user_type } = req.body;
  try {
    let Account: any;

    switch (user_type) {
      case "merchant":
        Account = Merchant;
        break;
      case "user":
        Account = User;
        break;
      default:
        return res.status(400).json(error("Invalid user type", res.statusCode));
    }

    let isAccount = await Account.findOne({ email: req.body.email });
    if (!isAccount) return res.status(404).json(error(`We could not find any account with the email ${req.body.email}`, res.statusCode));
    isAccount.reset_password_otp = otp_code();
    isAccount.resetPasswordExpires = Date.now() + 3600000;

    isAccount = await isAccount.save();
    let link = isAccount.reset_password_otp;

    const name = user_type === "merchant" ? isAccount.first_name : isAccount.full_name.split(" ")[0];
    const email = isAccount.email;
    const mail_data = dynamic_template_data({ email, template_id: "d-e796cae1581948f79b1d2b522823e35d", data: { first_name: name, verification_code: link } });
    sendEmail(mail_data);
    return res.json(success("A password reset email was sent to you", {}, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
};


// @route POST api/auth/reset
// @desc Reset Password
// @access Public
export const resetPassword = async (req: Request, res: Response) => {
  const { user_type } = req.body;
  try {
    let Account: any;

    switch (user_type) {
      case "merchant":
        Account = Merchant;
        break;
      case "user":
        Account = User;
        break;
      default:
        return res.status(400).json(error("Invalid user type", res.statusCode));
    }

    let isAccount = await Account.findOne({ reset_password_otp: req.body.otp, resetPasswordExpires: { $gt: Date.now() } });
    console.log(isAccount)
    if (!isAccount) return res.status(401).json(error("Invalid password reset Code or Code has expired", res.statusCode));
    const hash = bcrypt.hashSync(req.body.password, 12);
    isAccount.password = hash;
    isAccount.reset_password_otp = undefined;
    isAccount.resetPasswordExpires = undefined;
    const result = await isAccount.save();
    if (!result) return res.status(400).json(error("Failed to update password. Try again", res.statusCode));

    const name = user_type === "merchant" ? isAccount.full_name.split(" ")[0] : isAccount.first_name,
      email = isAccount.email;
    const mail_data = dynamic_template_data({ email, template_id: "d-ac7d4c85964c46359de9023f9c9bf407", data: { first_name: name } });
    sendEmail(mail_data)
    return res.json(success("Success", { message: "Your password was reset successfully!" }, res.statusCode));
  } catch (err: any) {
    console.log(err)
    return res.status(500).json(error("Internal Server Error. Try again after some time", res.statusCode));
  }
};
