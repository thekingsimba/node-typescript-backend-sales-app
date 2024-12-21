import { Router } from "express";
import { verifyUser } from "../../middleware/auth";
import { 
  accepted_orders,
  admin_dashboard_monthly_earnings,
  admin_latest_orders,
  cancel_order,
  create, 
  dashboard_order_overview, 
  merchant_dashboard_overview, 
  delivered_orders, 
  merchant_latest_orders, 
  merchant_order_by_status, 
  merchant_revenue, 
  new_orders, 
  orderList, 
  order_overview, 
  order_statistics, 
  pickedup_orders, 
  processed_orders, 
  processing_orders, 
  rejected_orders, 
  restaurantOrderList, 
  search_filter, 
  singleOrder, 
  update_order_status,
  user_delivered_orders, 
  user_order, 
  user_pickedup_orders, 
  user_processed_orders, 
  user_processing_orders, 
  user_rejected_orders,
  admin_order_list_by_status,
  deliver_order,
  deliveryStatusUpdate,
} from "./order.controller";
import {
  cancel_order_status_validator,
  createValidator,
  update_order_status_validator
} from "./order.validation";

export const orderRouter = Router();

orderRouter.post("/create", verifyUser, createValidator, create);
orderRouter.get("/all", orderList);
orderRouter.get("/restaurant/orders", restaurantOrderList);
orderRouter.get("/details", verifyUser, singleOrder);
orderRouter.get("/user/orders", verifyUser, user_order);
orderRouter.put("/status", verifyUser, update_order_status_validator, update_order_status);
orderRouter.put("/rider/delivery", deliver_order);
orderRouter.get("/new/list", verifyUser, new_orders);
orderRouter.get("/admin/new", verifyUser, new_orders);
orderRouter.get("/accepted/list", verifyUser, accepted_orders);
orderRouter.get("/admin/latest", verifyUser, admin_latest_orders);
orderRouter.get("/rejected/list", verifyUser, rejected_orders);
orderRouter.get("/user/rejected/list", verifyUser, user_rejected_orders);
orderRouter.get("/processing/list", verifyUser, processing_orders);
orderRouter.get("/user/processing/list", verifyUser, user_processing_orders);
orderRouter.get("/processed/list", verifyUser, processed_orders);
orderRouter.get("/user/processed/list", verifyUser, user_processed_orders);
orderRouter.get("/pickedup/list", verifyUser, pickedup_orders);
orderRouter.get("/user/pickedup/list", verifyUser, user_pickedup_orders);
orderRouter.get("/delivered/list", verifyUser, delivered_orders);
orderRouter.get("/user/delivered/list", verifyUser, user_delivered_orders);
orderRouter.get("/overview", verifyUser, order_overview);
orderRouter.put("/delivery/status", deliveryStatusUpdate)
orderRouter.get("/list/status", verifyUser, merchant_order_by_status);
orderRouter.get("/list/latest", verifyUser, merchant_latest_orders),
orderRouter.put("/cancel", verifyUser,cancel_order_status_validator, cancel_order);
orderRouter.get("/dashboard/overview", verifyUser, merchant_dashboard_overview);
orderRouter.get("/analysis", verifyUser, order_statistics);
orderRouter.get("/merchant/revenue", verifyUser, merchant_revenue);
orderRouter.get("/admin/overview", verifyUser, dashboard_order_overview);
orderRouter.get("/search", search_filter);
orderRouter.get("/dashboard/monthly/earnings", verifyUser, admin_dashboard_monthly_earnings);
orderRouter.get("/admin/order_by_status", verifyUser, admin_order_list_by_status);