import { Router } from "express";
import { verifyUser } from "../../middleware/auth";
import { 
  add_address, 
  add_stripe_id, 
  admin_dashboard_customer_details, 
  customer_db_list, 
  dashboard_customer_recent_orders, 
  dashboard_customer_recent_transactions, 
  deleteUser, 
  device_token_update, 
  email_login, 
  email_signup, 
  email_validation, 
  get_stripe_customer_details, 
  get_user_address, 
  resend_otp, 
  search_customers, 
  social_auth, 
  updateUser, 
  userDetails, 
  userList, 
  verify_phone_number
} from "./users.controller";
import { email_create_validation, email_login_validation, social_create_validation } from "./user.validator";

export const userRouter = Router();

userRouter.post("/social_auth", social_auth);
userRouter.post("/email_signup", email_signup);
userRouter.post("/email_login", email_login_validation, email_login);
userRouter.post("/otp/resend", resend_otp);
userRouter.post("/verify", verify_phone_number);
userRouter.get("/list", userList);
userRouter.get("/details", userDetails);
userRouter.put("/update", verifyUser, updateUser);
userRouter.delete("/delete", verifyUser, deleteUser);
userRouter.post("/create/stripe", verifyUser, add_stripe_id);
userRouter.post("/verify/email", email_validation);
userRouter.post("/address/new", verifyUser, add_address);
userRouter.get("/address", verifyUser, get_user_address);
userRouter.put("/update/device_token", device_token_update);
userRouter.get("/dashboard/customers", verifyUser, customer_db_list);
userRouter.get("/dashboard/search", verifyUser, search_customers);
userRouter.get("/dashboard/customer/details", verifyUser, admin_dashboard_customer_details);
userRouter.get("/dashboard/customer/recent/orders", verifyUser, dashboard_customer_recent_orders);
userRouter.get("/dashboard/customer/recent/transactions", verifyUser, dashboard_customer_recent_transactions);
userRouter.get("/stripe/customer", verifyUser, get_stripe_customer_details);
