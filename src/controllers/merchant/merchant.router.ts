import { Router } from "express";
import { verifyUser } from "../../middleware/auth";
import { about_info, add_banner_image, approve_merchant, createMerchant, 
  create_stripe_account_link, 
  dashboard_merchant_details, 
  delete_operation_day, 
  delete_operation_days, 
  device_token_update, 
  end_offers, 
  fhr_image_update, 
  fsa_inspection_details, 
  getList, 
  getMerchantRatings, 
  getRatings, 
  get_opening_and_closing_time_list, 
  get_otp, 
  get_store_by_name, 
  get_stripe_customer_details, 
  login, 
  merchants_near_you, 
  notification_setting, 
  offers_near_you, 
  rateMerchant, 
  reset_password, 
  retrieve_transaction_history, 
  set_offers, 
  set_opening_and_closing_time, 
  status_update, 
  stripe_connect_account_status_update, 
  update_bank_details, 
  update_opening_and_closing_time, 
  verify_email, 
  verify_phone_number,

} from "./merchant.controller";
import { getRatingValidator, ratingValidator, statusValidator } from "./merchant.validator";

export const merchantRoutes = Router();

merchantRoutes.post("/create", createMerchant);
merchantRoutes.post("/otp", get_otp);
merchantRoutes.post("/verify/phone", verify_phone_number);
merchantRoutes.post("/login", login);
merchantRoutes.get("/all", getList);
merchantRoutes.get("/ratings", getRatingValidator, getRatings);
merchantRoutes.put("/rating", verifyUser, ratingValidator, rateMerchant);
merchantRoutes.put("/restaurant/rating", verifyUser, getMerchantRatings);
merchantRoutes.put("/set_offer", verifyUser, set_offers);
merchantRoutes.put("/end_offer", verifyUser, end_offers);
merchantRoutes.get("/around_you", merchants_near_you);
merchantRoutes.get("/offers/around_you", offers_near_you);
merchantRoutes.post("/notification/settings", verifyUser, notification_setting);
merchantRoutes.post("/update/bank_details", verifyUser, update_bank_details);
merchantRoutes.put("/update/device_token", device_token_update);
merchantRoutes.put("/approve", approve_merchant);
merchantRoutes.put("/status", verifyUser, statusValidator, status_update);
merchantRoutes.get("/dashboard/merchant/details", dashboard_merchant_details);
merchantRoutes.post("/account/link", verifyUser, create_stripe_account_link);
merchantRoutes.put("/update/operation_time", verifyUser, set_opening_and_closing_time);
merchantRoutes.put("/update/close", verifyUser, update_opening_and_closing_time);
merchantRoutes.put("/update/stripe_connect_status", verifyUser, stripe_connect_account_status_update);
merchantRoutes.get("/operation_days", get_opening_and_closing_time_list);
merchantRoutes.post("/dashboard/reset_password", reset_password);
merchantRoutes.put("/verify/email", verify_email);
merchantRoutes.put("/fsa/info", verifyUser, fsa_inspection_details);
merchantRoutes.put("/about", verifyUser, about_info);
merchantRoutes.get("/operation_days/delete_all", verifyUser, delete_operation_days);
merchantRoutes.get("/operation_days/remove_one", verifyUser, delete_operation_day);
merchantRoutes.get("/stripe/customer", verifyUser, get_stripe_customer_details);
merchantRoutes.get("/stripe/customer/transactions", verifyUser, retrieve_transaction_history);
merchantRoutes.put("/banner/upload", add_banner_image);
merchantRoutes.put("/fhr/image/update", fhr_image_update);
merchantRoutes.get("/store-by-name", get_store_by_name);