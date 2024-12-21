import { Request, Response } from 'express';
import { Schema } from 'mongoose';
import Stripe from 'stripe';
import key from '../../config/key';
import { error, success } from '../../config/response';
import { Cart } from '../../controllers/cart/cart.schema';
import { Merchant } from '../../controllers/merchant/merchant.schema';
import { expoNotification, send_notification_for_order } from '../../controllers/notification/notification.controller';
import { User } from '../../controllers/users/users.schema';
import { paginated_data, pagination } from '../../middleware/pagination';
import { annual_chart, last_month_data, last_year_data, this_month_data, weekly_data } from '../../utils/chart';
import { transaction_code } from '../../utils/code_gen';
import Logger from '../../utils/logger';
import { sendEmail } from '../../utils/mailer';
import { dynamic_template_data } from '../../utils/template';
import { computed_time, last_day_of_month } from '../../utils/util';
import { IOrder, Update } from './order.interface';
import { Order } from './order.schema';
import { add_user } from 'controllers/discountPromotion/discount.controller';
import path from "path";

require("dotenv").config({ path: path.resolve(__dirname + "/../../../.env") });

const stripe = new Stripe(key.STRIPE_KEY, { "apiVersion": "2022-11-15" });

interface IMerchant_Type {
  merchant_type: {
    _id: Schema.Types.ObjectId;
    name: 'Restaurants'
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { promo_code } = req.body;
    let user_address = await User.findById(req.body.userId);
    if (!user_address) return res.status(400).json(error("Unknown user", res.statusCode));
    
    const { cart_id, actual_cost } = req.body;
    let cart = await Cart.findById({ _id: cart_id });
    if (!cart) return res.status(404).json(error("Cart not found", res.statusCode));
    if (cart && cart.merchants && cart.merchants.length === 0) return res.status(200).json(error("You do not have any items in your cart", res.statusCode));
    const merchants = cart && cart.merchants;
    let newOrder;
    for (let i = 0; i < merchants.length; i++) {
      const items = merchants[i].items;
      
      const merchant_category: IMerchant_Type = await Merchant.findById(merchants[i].merchant_id).populate("merchant_type", "name");
      let order_items: IOrder["items"] = [];
      let restaurantId;
      let count = 0;
      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        restaurantId = items[0].restaurantId;
        const data = {
          name: item && item.name,
          foodPrice: item && item.foodPrice,
          extras: item && item.extras,
          description: item && item.description,
          extra_cost: item && item.extra_cost,
          restaurantId: item && item.restaurantId,
          totalCost: item && item.totalPrice,
          foodId: item && item.foodId,
          quantity: item && item.quantity,
          weight: item && item.weight
        }
        order_items.push(data);
      }
      
      const order_data: any = {
        items: order_items,
        userId: req.body.userId,
        deliveryAddress: req.body.delivery_address,
        deliveryFee: req.body.deliveryFee,
        serviceFee: req.body.serviceFee,
        estimatedDeliveryTime: await computed_time(req.body.estimatedDeliveryTime),
        payment_token: req.body.payment_token,
        lat: req.body.lat,
        long: req.body.long,
        restaurantId,
        merchant_category: merchant_category && merchant_category.merchant_type && merchant_category.merchant_type["name"],
        subtotal: actual_cost && actual_cost > req.body.subtotal ? req.body.subtotal + 5 : req.body.subtotal,
        payment_status: "successful",
        grand_total: actual_cost && actual_cost > req.body.subtotal ? Number((req.body.grandTotal + 5).toFixed(2)) : req.body.grandTotal,
        reference_code: transaction_code(),
        note: req.body.note,
      }
      newOrder = new Order(order_data);
      newOrder.status_time_tracker.push({ status: "new" });
      newOrder = await newOrder.save();

      user_address.last_order_date = new Date();
      let updated_user = await User.findByIdAndUpdate(user_address._id, { $set: { last_order_date: new Date()}}, { new: true });
      const merchant = await Merchant.findById(restaurantId);
     
      const notification_data = {
        title: `New order request from ${user_address.full_name}`,
        message: "A new order has just arrived for you. View the ordered items and get them ready for pickup",
        receiver: {
          user_id: restaurantId,
          first_name: merchant && merchant.first_name,
          last_name: merchant && merchant.last_name,
          phone_number: merchant && merchant.phone_number
        },
        order: newOrder,
        order_id: newOrder._id,
        notification_id: 1,
        device_token: merchant && merchant.device_token
      }
    
      send_notification_for_order(notification_data);
      expoNotification(notification_data);
      // }
    }
    cart.merchants = [];
    cart.totalCost = 0;
    cart.totalItems = 0;
    cart = await cart.save();
    Logger.info(JSON.stringify(req.body));
    add_user({ email: user_address.email, coupon: promo_code })
    return res.json(success("Order created", newOrder, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const restaurantOrderList = async (req: Request, res: Response) => {
  try {
    const { restaurantId, page, limit } = req.query;
    const orders = await Order.find({ restaurantId, payment_status: "successful" })
      .populate("items.restaurantId", "first_name last_name email phone_number restuarant_name address ratings averageRating totalRating image_url")
      .populate("userId", "full_name email phone address")
      .populate("items.extras")
      .populate("items.foodId")
      .sort({ createdAt: -1 });
    const result = paginated_data(orders, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const socketRestaurantOrderList = async (data: any) => {
  try {
    const { merchant_id } = data;
    const orders = await Order.find({ restaurantId: merchant_id, payment_status: "complete" })
      .populate("items.restaurantId", "first_name last_name email phone_number restuarant_name address ratings averageRating totalRating image_url")
      .populate("userId", "full_name email phone address")
      .populate("items.extras", "name price restaurant")
      .populate("items.foodId")
      .sort({ createdAt: -1 });
    
    return { data: orders }
  } catch (err: any) {
    Logger.error(err.message);
    return { error: err.message };
  }
}

export const orderList = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    
    const orders = await Order.find({})
      .populate("items.restaurantId", "first_name last_name email phone_number restaurant_name address ratings averageRating totalRating image_url")
      .populate("userId", "full_name email phone address")
      .populate("items.extras", "name price restaurant")
      .populate("items.foodId")
      .sort({ createdAt: -1 });
    const result = paginated_data(orders, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const singleOrder = async (req: Request, res: Response) => {
  try {
    const { orderId} = req.query;
    let order = await Order.findOne({ _id: orderId })
      .populate("restaurantId", "first_name last_name email phone_number restaurant_name address ratings averageRating totalRating image_url")
      .populate("userId", "full_name email phone address")
      .populate("items.extras")
      .populate("items.foodId");
    if (!order) return res.status(404).json(error("Order does not exist", res.statusCode));
    return res.json(success("Order updated!", order, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const user_order = async (req: Request, res: Response) => {
  try {
    const { user_id} = req.query;
    let order = await Order.find({ userId: user_id }).sort({ createdAt: -1 })
      .populate("items.restaurantId", "first_name last_name email phone_number restaurant_name address ratings averageRating totalRating image_url")
      .populate("userId", "full_name email phone address")
      .populate("items.extras", "name price restaurant")
      .populate("items.foodId");
    if (!order) return res.status(404).json(error("Order does not exist", res.statusCode));
    return res.json(success("Order updated!", order, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const update_order_status = async (req: Request, res: Response) => {
  try {
    const { orderId, status }: Update = req.body;
    let order;
    let merchant;
    switch(status) {
      case "accepted":
        order = await Order.findById(orderId);
        if (order && order.status && order.status.toLowerCase() === "accepted")
          return res.status(400).json(error(`This order is already ${status}`, res.statusCode));
        order = await Order.findByIdAndUpdate(orderId, 
          { $set: { status: status === "accepted" ? "processing" : status }, $push: { status_time_tracker: { status, time: new Date() }}}, { new: true });
        if (!order) return res.status(400).json(error("No records found for this request", res.statusCode));
        merchant = await Merchant.findById(order.restaurantId);
        const user = await User.findById(order.userId);
        let device_token;
        if (user) device_token = user.device_token;
        let merchant_address;
        if (merchant) {
          merchant_address = `${merchant.address.line_1} ${merchant.address.post_code} ${merchant.address.country}`
        }
        
        const rider_email_data = dynamic_template_data(
          {
            email: process.env.MAIN_RIDER_EMAIL,
            template_id: process.env.RIDER_EMAIL_TEMPLATE_KEY, 
            data: { 
              first_name: "James",
              merchant_name: merchant.restaurant_name,
              order_id: order && order.reference_code,
              order_details: order && order.items[0].name,
              customer_address: order && order.deliveryAddress,
              merchant_address: merchant_address && merchant_address,
              pickup_link: `${process.env.MERCHANT_HUB_URL}/delivery?order_id=${order._id}&status=pickedup`,
              delivered_link: `${process.env.MERCHANT_HUB_URL}/delivery?order_id=${order._id}&status=delivered`,
            }
          }
        );
        sendEmail(rider_email_data);
        Logger.info(JSON.stringify(req.body));

        const pushdata = {
          title: `Order Update!`,
          message: `Your order ${order.items[0].name} has been accepted by ${merchant.restaurant_name} and it's processing.`,
          notification_id: 1,
          receiver: {
            user_id: user._id,
            first_name: user.full_name.split(" ")[0],
            last_name: user.full_name.split(" ")[1],
            phone_number: user.phone
          },
          order,
          order_id: order._id,
          device_token
        }
        send_notification_for_order(pushdata);
        await order.save();
        res.json(success("Success", order, res.statusCode));
        break;
      case "rejected":
        order = await Order.findById(orderId);
        if (order && order.status && order.status.toLowerCase() === "rejected")
          return res.status(400).json(error(`This order is already ${status}`, res.statusCode));
        order = await Order.findByIdAndUpdate(orderId, { $set: { status }, $push: { status_time_tracker: { status, time: new Date() }}}, { new: true });
        if (!order) return res.status(400).json(error("No records found for this request", res.statusCode));
        Logger.info(JSON.stringify(req.body));
        const userdetail: any = await User.findById(order.userId);
        let dev_token: string;
        if (userdetail) dev_token = userdetail.device_token;
        merchant = await Merchant.findById(order.restaurantId);

        const userdet: any = await User.findById(order.userId);
        
        const notification_data = {
          title: `Order Update!`,
          message: `Your order ${order.items[0].name} has been rejected. Please contact support if your payment has not been refunded.`,
          notification_id: 1,
          receiver: {
            user_id: userdet && userdet._id,
            first_name: userdet && userdet.full_name.split(" ")[0],
            last_name: userdet && userdet.full_name.split(" ")[1],
            phone_number: userdet && userdet.phone
          },
          order,
          order_id: order._id,
          device_token: dev_token
        }
        send_notification_for_order(notification_data);
        res.json(success("Success", order, res.statusCode));
        break;
      case "processing":
        order = await Order.findById(orderId);
        if (order && order.status && order.status.toLowerCase() === "processing") 
          return res.status(400).json(error(`This order is already ${status}`, res.statusCode));
        order = await Order.findByIdAndUpdate(orderId, { $set: { status }, $push: { status_time_tracker: { status, time: new Date() }}}, { new: true });
        if (!order) return res.status(400).json(error("No records found for this request", res.statusCode));
        Logger.info(JSON.stringify(req.body));
        const user_detail: any = await User.findById(order.userId);
        merchant = await Merchant.findById(order.restaurantId)
        let d_token: string;
        if (user_detail) d_token = user_detail.device_token;
        const notif_data = {
          title: `Order Update!`,
          message: `Your order ${order.items[0].name} is been processed by ${merchant.restaurant_name}.`,
          notification_id: 1,
          receiver: {
            user_id: user_detail._id,
            first_name: user_detail.full_name.split(" ")[0],
            last_name: user_detail.full_name.split(" ")[1],
            phone_number: user_detail.phone
          },
          order,
          order_id: order._id,
          device_token: d_token
        }
        send_notification_for_order(notif_data);
        res.json(success("Success", order, res.statusCode));
        break;
      
      case "pickedup":
        order = await Order.findById(orderId);
        if (order && order.status && order.status.toLowerCase() === "pickedup") 
          return res.status(400).json(error(`This order is already ${status}`, res.statusCode));
        order = await Order.findByIdAndUpdate(orderId, { $set: { status }, $push: { status_time_tracker: { status, time: new Date() }}}, { new: true });
        if (!order) return res.status(400).json(error("No records found for this request", res.statusCode));
        Logger.info(JSON.stringify(req.body));
        const user_Detail: any = await User.findById(order.userId);
        let dtoken: string;
        if (user_Detail) dtoken = user_Detail.device_token;
        const no_data = {
          title: `Order Update!`,
          message: `Your order ${order.items[0].name} has been picked up by a rider and will be delivered soon.`,
          notification_id: 1,
          receiver: {
            user_id: user_Detail._id,
            first_name: user_Detail.full_name.split(" ")[0],
            last_name: user_Detail.full_name.split(" ")[1],
            phone_number: user_Detail.phone
          },
          order,
          order_id: order._id,
          device_token: dtoken
        }
        send_notification_for_order(no_data);
        res.json(success("Success", order, res.statusCode));
        break;
      case "delivered":
        order = await Order.findById(orderId);
        if (order && order.status && order.status.toLowerCase() === "delivered") 
          return res.status(400).json(error(`This order is already ${status}`, res.statusCode));
        order = await Order.findByIdAndUpdate(orderId, { $set: { status }, $push: { status_time_tracker: { status, time: new Date() }}}, { new: true });
        if (!order) return res.status(400).json(error("No records found for this request", res.statusCode));
        Logger.info(JSON.stringify(req.body));
        const detail: any = await User.findById(order.userId);
        let devi_token: string;
        if (detail) devi_token = detail.device_token;
        const n_data = {
          title: `Order Update!`,
          message: `Your order ${order.items[0].name} has arrived.`,
          notification_id: 1,
          receiver: {
            user_id: detail._id,
            first_name: detail.full_name.split(" ")[0],
            last_name: detail.full_name.split(" ")[1],
            phone_number: detail.phone
          },
          order,
          order_id: order._id,
          device_token: devi_token
        }
        send_notification_for_order(n_data);
        res.json(success("Success", order, res.statusCode));
        break;
      default: return res.status(400).json(error("Invalid order status", res.statusCode));
    }
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const deliveryStatusUpdate = async (req: Request, res: Response) => {
  try {
    const { status, reference } = req.body;
    if (!status || !reference) return res.status(400).json(error("Invalid request parameters: ", res.statusCode));
    const order = await Order.findOneAndUpdate({ reference_code: reference }, { $set: { status }, $push: { status_time_tracker: { status, time: new Date() }}}, { new: true });
    if (!order) return res.status(400).json(error(`No order with reference code ${reference} found`, res.statusCode));
    return res.json(success("Success", order, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const deliver_order = async (req: Request, res: Response) => {
  try {
    const { order_id, status } = req.query;
    if (status !== "pickedup" && status !== "delivered") return res.status(400).json(error("Status must be either pickedup or delivered", res.statusCode));
    const picked_order = await Order.findById(order_id);
    if (picked_order && picked_order.status === status) return res.status(400).json(error(`Order already is already ${status}`, res.statusCode));
    const order = await Order.findByIdAndUpdate(order_id, { $set: { status }, $push: { status_time_tracker: { status, time: new Date() }}}, { new: true });

    const user: any = await User.findById(order.userId);
        let device: string;
        if (user) device = user.device_token;
        const order_status = status === "pickedup" ? "picked up" : status;
        const n_data = {
          title: `Order Update!`,
          message: `Your order ${order.items[0].name} has been ${order_status}.`,
          notification_id: 1,
          receiver: {
            user_id: user._id,
            first_name: user.full_name.split(" ")[0],
            last_name: user.full_name.split(" ")[1],
            phone_number: user.phone
          },
          order,
          order_id: order._id,
          device_token: device
        }
    send_notification_for_order(n_data);
    return res.json(success("Success", order, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const new_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const orders = await Order.paginate({ status: "new" }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const rejected_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { restaurantId } = req.query;
    const orders = await Order.paginate({ status: "rejected", "items.restaurantId": restaurantId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const user_rejected_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { userId } = req.query;
    const orders = await Order.paginate({ status: "rejected", userId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const accepted_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { restaurantId } = req.query;
    const orders = await Order.paginate({ status: "accepted", "items.restaurantId": restaurantId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }})
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const admin_latest_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const orders = await Order.paginate({}, { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const processing_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { restaurantId } = req.query;
    const orders = await Order.paginate({ status: "processing", "items.restaurantId": restaurantId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }})
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const user_processing_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { userId } = req.query;
    const orders = await Order.paginate({ status: "processing", userId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }})
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const processed_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { restaurantId  } = req.query;
    const orders = await Order.paginate({ status: "processed", "items.restaurantId": restaurantId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const user_processed_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { userId  } = req.query;
    const orders = await Order.paginate({ status: "processed", userId },
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const pickedup_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { restaurantId } = req.query;
    const orders = await Order.paginate({ status: "pickedup", "items.restaurantId": restaurantId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const user_pickedup_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { userId } = req.query;
    const orders = await Order.paginate({ status: "pickedup", userId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const delivered_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { restaurantId } = req.query;
    const orders = await Order.paginate({ status: "delivered", "items.restaurantId": restaurantId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const user_delivered_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { restaurantId } = req.query;
    const orders = await Order.paginate({ status: "delivered", "items.restaurantId": restaurantId }, 
    { offset, limit, populate: ["userId", "items.restaurantId", "items.foodId"], sort: { createdAt: -1 }});
    if (!orders) return res.status(400).json(error("No records found for this request", res.statusCode));
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const order_overview = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, merchant_id } = req.query;
    
    let startDate = new Date(start_date.toLocaleString());
    let endDate = new Date(end_date.toLocaleString())
    const begin_at = new Date(startDate.setMonth(startDate.getMonth()));
    let lastDate = new Date(endDate.setMonth(endDate.getMonth()));
    let startDate_month_start = new Date(startDate.setDate(1));
    let startDate_month_end = startDate.getDate() === 2 ? new Date(startDate.setDate(28)) : new Date(startDate.setDate(30));
    let endDate_month_start = new Date(startDate.setDate(1));
    let endDate_month_end = endDate.getDate() === 2 ? new Date(endDate.setDate(28)) : new Date(endDate.setDate(30));

    const total_orders = await Order.countDocuments({
      "items.restaurantId": merchant_id, 
      createdAt: {
        $gte: new Date(new Date(begin_at).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(lastDate).setHours(23, 59, 59)) 
      } 
    });
    const cancelled_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "cancelled", 
      createdAt: { 
        $gte: new Date(new Date(begin_at).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(lastDate).setHours(23, 59, 59)) 
      } 
    });
    const completed_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(begin_at).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(lastDate).setHours(23, 59, 59)) 
      } 
    });

    const startDate_total_orders = await Order.countDocuments({
      "items.restaurantId": merchant_id, 
      createdAt: {
        $gte: new Date(new Date(startDate_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(startDate_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_total_orders = await Order.countDocuments({
      "items.restaurantId": merchant_id, 
      createdAt: {
        $gte: new Date(new Date(endDate_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(endDate_month_end).setHours(23, 59, 59)) 
      } 
    });


    const startDate_cancelled_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "cancelled", 
      createdAt: { 
        $gte: new Date(new Date(startDate_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(startDate_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_cancelled_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "cancelled", 
      createdAt: { 
        $gte: new Date(new Date(endDate_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(endDate_month_end).setHours(23, 59, 59)) 
      } 
    });

    const startDate_completed_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(startDate_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(startDate_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_completed_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(endDate_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(endDate_month_end).setHours(23, 59, 59)) 
      } 
    });

    const delivered_orders = await Order.find({
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(begin_at).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(lastDate).setHours(23, 59, 59)) 
      }
    });

    const startDate_delivered_orders = await Order.find({
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(startDate_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(startDate_month_end).setHours(23, 59, 59))
      }
    });

    const endDate_delivered_orders = await Order.find({
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(endDate_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(endDate_month_end).setHours(23, 59, 59))
      }
    });

    const total_orders_diff = endDate_total_orders - startDate_total_orders;
    const total_orders_percentage_diff = total_orders_diff === 0 ? 0 : ((total_orders_diff * 100)/startDate_total_orders).toFixed(2);
    const cancelled_total_orders_diff = endDate_cancelled_orders - startDate_cancelled_orders;
    const cancelled_orders_percentage_diff = cancelled_total_orders_diff === 0 ? 0 : ((cancelled_total_orders_diff * 100)/startDate_cancelled_orders).toFixed(2);
    const complete_total_orders_diff = endDate_completed_orders - startDate_completed_orders;
    const complete_orders_percentage_diff = complete_total_orders_diff === 0 ? 0 : ((complete_total_orders_diff * 100)/startDate_completed_orders).toFixed(2);
    const total_sum = delivered_orders.map(order => order.subtotal).reduce((a,b) => a+b,0);
    const start_date_income = startDate_delivered_orders.map(order => order.subtotal).reduce((a, b) => a+b,0);
    const end_date_income = endDate_delivered_orders.map(order => order.subtotal).reduce((a, b) => a+b,0);
    const income_diff = end_date_income - start_date_income;
    const income_percentage_diff = income_diff === 0 ? 0 : ((income_diff * 100)/start_date_income).toFixed(2);
    const result = {
      income: total_sum,
      completed_orders,
      cancelled_orders,
      total_orders,
      total_orders_percentage_diff: `${total_orders_percentage_diff.toString()}%`,
      cancelled_orders_percentage_diff: `${cancelled_orders_percentage_diff.toString()}%`,
      complete_orders_percentage_diff: `${complete_orders_percentage_diff.toString()}%`,
      total_income_percentage_diff: `${income_percentage_diff.toString()}%`,
    }
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const merchant_order_by_status = async (req: Request, res: Response) => {
  try {
    const { limit, offset } = pagination(req.query);
    const { restaurantId, status } = req.query;
    const orders = await Order.paginate({ 
      "items.restaurantId": restaurantId, status 
    }, 
    { offset, limit, populate: [ "userId", "items.restaurantId"], sort: { createdAt: -1 }});
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const cancel_order = async (req: Request, res: Response) => {
  try {
    const { user_id, order_id } = req.body;
    let order = await Order.findOne({ userId: user_id, _id: order_id });
    if (!order) return res.status(400).json(error("Order not found", res.statusCode));
    if (order && order.status && order.status.toLocaleLowerCase() !== "new") 
      return res.status(400).json(error("You cannot cancel the order at this stage because it's already being processed", res.statusCode));

    order.status = "cancelled";
    order = await order.save();
    return res.json(success("Success", order, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const merchant_dashboard_overview = async (req: Request, res: Response) => {
  try {
    const { merchant_id } = req.query;
    const merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error("Merchant account not found", res.statusCode));
    const now = new Date();
    
    const current_month_start = new Date(now.setDate(1));
    const current_month_end = current_month_start.getMonth() === 2 ?
    new Date(now.setDate(28)) : current_month_start.getMonth() === 4 ?
    new Date(now.setDate(30)) : current_month_start.getMonth() === 6 ?
    new Date(now.setDate(30)) : current_month_start.getMonth() === 9 ?
    new Date(now.setDate(30)) : current_month_start.getMonth() === 11 ?
    new Date(now.setDate(30)) : new Date(now.setDate(31));

    const last_month = new Date(new Date().setMonth(new Date().getMonth() - 1));
    const last_month_start = new Date(last_month.setDate(1));
    const last_month_end = last_day_of_month(last_month)
  
    const delivered_orders = await Order.countDocuments({ "items.restaurantId": merchant_id, status: "delivered" });
    const rejected_orders = await Order.countDocuments({ "items.restaurantId": merchant_id, status: "rejected" });
    const total_income = await Order.find({ restaurantId: merchant_id, status: "delivered" });
    const totalSale = total_income && total_income.map(income => income.subtotal).reduce((a, b) => a+b,0).toFixed(2);

    const startDate_total_income = await Order.find({ 
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(current_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(current_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_total_income = await Order.find({ 
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(last_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(last_month_end).setHours(23, 59, 59))
      }
    });

    const startDate_delivered_orders = await Order.countDocuments({
      "items.restaurantId": merchant_id,
      status: "delivered", 
      createdAt: {
        $gte: new Date(new Date(current_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(current_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_delivered_orders = await Order.countDocuments({
      "items.restaurantId": merchant_id,
      status: "delivered", 
      createdAt: {
        $gte: new Date(new Date(last_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(last_month_end).setHours(23, 59, 59)) 
      } 
    });

    const startDate_rejected_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "rejected", 
      createdAt: { 
        $gte: new Date(new Date(current_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(current_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_rejected_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "rejected", 
      createdAt: { 
        $gte: new Date(new Date(last_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(last_month_end).setHours(23, 59, 59))
      } 
    });

    const start_total_income = startDate_total_income && startDate_total_income.map(order => order.subtotal).reduce((a,b) => a+b,0);
    const end_total_income = endDate_total_income && endDate_total_income.map(order => order.subtotal).reduce((a,b) => a+b,0)
    const delivered_orders_diff = endDate_delivered_orders - startDate_delivered_orders;
    const delivered_orders_percentage_diff = delivered_orders_diff === 0 ? 0 : ((delivered_orders_diff * 100)/startDate_delivered_orders).toFixed(2);
    const rejected_orders_diff = endDate_rejected_orders - startDate_rejected_orders;
    const rejected_orders_percentage_diff = rejected_orders_diff === 0 ? 0 : ((rejected_orders_diff * 100)/startDate_rejected_orders).toFixed(2);
    const total_income_diff = end_total_income - start_total_income
    const total_income_percentage_diff = total_income_diff === 0 ? 0 : ((total_income_diff * 100)/start_total_income).toFixed(2);
    const result = {
      total_income: totalSale,
      delivered_orders,
      rejected_orders,
      average_rating: merchant && merchant.averageRating,
      total_rating: merchant && merchant.totalRating,
      delivered_orders_percentage_diff: `${delivered_orders_percentage_diff.toString()}%`,
      rejected_orders_percentage_diff: `${rejected_orders_percentage_diff.toString()}%`,
      total_income_percentage_dff: `${total_income_percentage_diff.toString()}%`,
    }
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}


export const socket_merchant_dashboard_overview = async (data: any) => {
  try {
    const { merchant_id } = data;
    const merchant = await Merchant.findById(merchant_id);
    if (!merchant) return { error: "Merchant account not found"};
    const now = new Date();
    
    const current_month_start = new Date(now.setDate(1));
    const current_month_end = current_month_start.getMonth() === 2 ?
    new Date(now.setDate(28)) : current_month_start.getMonth() === 4 ?
    new Date(now.setDate(30)) : current_month_start.getMonth() === 6 ?
    new Date(now.setDate(30)) : current_month_start.getMonth() === 9 ?
    new Date(now.setDate(30)) : current_month_start.getMonth() === 11 ?
    new Date(now.setDate(30)) : new Date(now.setDate(31));

    const last_month = new Date(new Date().setMonth(new Date().getMonth() - 1));
    const last_month_start = new Date(last_month.setDate(1));
    const last_month_end = last_day_of_month(last_month)
  
    const delivered_orders = await Order.countDocuments({ "items.restaurantId": merchant_id, status: "delivered" });
    const rejected_orders = await Order.countDocuments({ "items.restaurantId": merchant_id, status: "rejected" });
    const total_income = await Order.find({ restaurantId: merchant_id, status: "delivered" });
    const totalSale = total_income && total_income.map(income => income.subtotal).reduce((a, b) => a+b,0).toFixed(2);

    const startDate_total_income = await Order.find({ 
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(current_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(current_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_total_income = await Order.find({ 
      "items.restaurantId": merchant_id, 
      status: "delivered", 
      createdAt: { 
        $gte: new Date(new Date(last_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(last_month_end).setHours(23, 59, 59))
      }
    });

    const startDate_delivered_orders = await Order.countDocuments({
      "items.restaurantId": merchant_id,
      status: "delivered", 
      createdAt: {
        $gte: new Date(new Date(current_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(current_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_delivered_orders = await Order.countDocuments({
      "items.restaurantId": merchant_id,
      status: "delivered", 
      createdAt: {
        $gte: new Date(new Date(last_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(last_month_end).setHours(23, 59, 59)) 
      } 
    });

    const startDate_rejected_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "rejected", 
      createdAt: { 
        $gte: new Date(new Date(current_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(current_month_end).setHours(23, 59, 59)) 
      } 
    });

    const endDate_rejected_orders = await Order.countDocuments({ 
      "items.restaurantId": merchant_id, 
      status: "rejected", 
      createdAt: { 
        $gte: new Date(new Date(last_month_start).setHours(0o0, 0o0, 0o0)), 
        $lte: new Date(new Date(last_month_end).setHours(23, 59, 59))
      } 
    });

    const start_total_income = startDate_total_income && startDate_total_income.map(order => order.subtotal).reduce((a,b) => a+b,0);
    const end_total_income = endDate_total_income && endDate_total_income.map(order => order.subtotal).reduce((a,b) => a+b,0)
    const delivered_orders_diff = endDate_delivered_orders - startDate_delivered_orders;
    const delivered_orders_percentage_diff = delivered_orders_diff === 0 ? 0 : ((delivered_orders_diff * 100)/startDate_delivered_orders).toFixed(2);
    const rejected_orders_diff = endDate_rejected_orders - startDate_rejected_orders;
    const rejected_orders_percentage_diff = rejected_orders_diff === 0 ? 0 : ((rejected_orders_diff * 100)/startDate_rejected_orders).toFixed(2);
    const total_income_diff = end_total_income - start_total_income
    const total_income_percentage_diff = total_income_diff === 0 ? 0 : ((total_income_diff * 100)/start_total_income).toFixed(2);
    const result = {
      total_income: totalSale,
      delivered_orders,
      rejected_orders,
      average_rating: merchant && merchant.averageRating,
      total_rating: merchant && merchant.totalRating,
      delivered_orders_percentage_diff: `${delivered_orders_percentage_diff.toString()}%`,
      rejected_orders_percentage_diff: `${rejected_orders_percentage_diff.toString()}%`,
      total_income_percentage_dff: `${total_income_percentage_diff.toString()}%`,
    }
    return { data: result };
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return { error: "Something went wrong. Please contact support team" };
  }
}

export const order_statistics = async (req: Request, res: Response) => {
  try {
    const { merchant_id, date_filter } = req.query;
    const merchant = await Merchant.findById(merchant_id);
    const regex = /\d{1,2}\/\d{1,2}\/\d{2,4}/
    let orders;
    if (!merchant) return res.status(400).json(error("We could not find a merchant with the ID provided", res.statusCode));
    if (date_filter.toString().toLowerCase() === "last 7 days") {
      const now = new Date();
      const start_date = new Date(new Date().setDate(new Date().getDate() - 7));
      orders = await Order.find({ 
        restaurantId: merchant_id, 
        createdAt: {
          $gte: new Date(start_date).setHours(0o0, 0o0, 0o0),
          $lte: new Date(now).setHours(23, 59, 59)
        } 
      });
      
      const chart_result = weekly_data(orders, start_date.getDate(), new Date().getDate());
      return res.json(success("Success", chart_result, res.statusCode));
    } else if (date_filter.toString().toLowerCase() === "last month") {
      const now = new Date();
      const last_month = new Date(now.setMonth(now.getMonth() - 1));
      const start_date = new Date(last_month.setDate(1));
      const last_date = last_day_of_month(last_month);

      orders = await Order.find({
        restaurantId: merchant_id,
        createdAt: {
          $gte: new Date(start_date).setHours(0o0, 0o0, 0o0),
          $lte: new Date(last_date).setHours(23, 59, 59)
        } 
      });
      const chart_result = last_month_data(orders, start_date.getDate(), last_date.getDate());
      return res.json(success("Success", chart_result, res.statusCode));
    } else if (regex.test(date_filter.toString())) {
      const now = new Date();
      
      const start_date = new Date(now.setDate(1));
      const last_date = last_day_of_month(now);

      orders = await Order.find({
        restaurantId: merchant_id,
        createdAt: {
          $gte: new Date(start_date).setHours(0o0, 0o0, 0o0),
          $lte: new Date(last_date).setHours(23, 59, 59)
        }
      });
      const chart_result = this_month_data(orders, start_date.getDate(), last_date.getDate());
      return res.json(success("Success", chart_result, res.statusCode));
    } else if (date_filter.toString().toLowerCase() === "last year") {
      const now = new Date();
      
      const start_year = new Date(now.setFullYear(now.getFullYear() - 1));
      const start_date = new Date(start_year.setMonth(0));
      const last_date = new Date(start_year.setMonth(11));
      orders = await Order.find({
        restaurantId: merchant_id,
        createdAt: {
          $gte: new Date(start_date).setHours(0o0, 0o0, 0o0),
          $lte: new Date(last_date).setHours(23, 59, 59)
        } 
      });
      const chart_result = last_year_data(orders);
      return res.json(success("Success", chart_result, res.statusCode));
    }
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const merchant_latest_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const order = await Order.paginate({ 
      restaurantId: req.query.merchant_id 
    }, 
    { 
      limit,
      offset,
      populate: [ "userId", "items.restaurantId" ],
      sort: { createdAt: -1 }
    });

    return res.json(success("Success", order, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const merchant_revenue = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const start_date = new Date(now.setDate(1));
    const end_date = last_day_of_month(now);

    const subtotals = await Order.find({ restaurantId: req.query.merchant_id, status: "delivered", createdAt: { 
      $gte: new Date(start_date.setHours(0o0, 0o0, 0o0)),
      $lte: new Date(end_date.setHours(23, 59,59))
    } }).select("subtotal -_id");

    const all_revenue = await Order.find({ restaurantId: req.query.merchant_id, status: "delivered" }).select("subtotal -_id");
    const all_time_revenue = all_revenue.map(revenue => revenue.subtotal).reduce((a,b) => a+b,0);
    const total_amount = subtotals && subtotals.map(subtotal => subtotal.subtotal).reduce((a,b) => a+b,0);
    const data = {
      sales_made_this_month: total_amount.toFixed(2),
      total_sale_of_all_time: all_time_revenue.toFixed(2)
    }
    return res.json(success("Success", data, res.statusCode));
  } catch (err: any) {
    Logger.error(err.message);
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const dashboard_order_overview = async (req: Request, res: Response) => {
  try {
    const { date_filter } = req.query;
    const regex = /\d{1,2}\/\d{1,2}\/\d{2,4}/
    const now = new Date()
    const yesterday = new Date(now.setDate(now.getDate() - 1));
    const yest_start_date = new Date(yesterday.setHours(0o0, 0o0, 0o0));
    const yest_end_date = new Date(yesterday.setHours(23, 59, 59));
    const today_start_date = new Date(new Date().setHours(0o0, 0o0, 0o0));
    const today_end_date = new Date(new Date().setHours(23, 59, 59));
    if (date_filter.toString().toLowerCase() === "today") {
      const start_date = new Date().setHours(0o0, 0o0, 0o0);
      const end_date = new Date().setHours(23, 59, 59);
      const all_orders = await Order.countDocuments({
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const today_all_orders = await Order.countDocuments({
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const all_yesterday_orders = await Order.countDocuments({
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const yesterday_pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const today_pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const yesterday_cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const today_cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const yesterday_completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const today_completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const yesterday_rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const today_rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const yest_all_order_diff = today_all_orders - all_yesterday_orders;
      const yest_all_order_percentage_diff = yest_all_order_diff === 0 ? 0 : (100 * yest_all_order_diff)/all_yesterday_orders;

      const yest_cancelled_order_diff = today_cancelled_orders - yesterday_cancelled_orders;
      const yest_cancelled_order_percentage_diff = yest_cancelled_order_diff === 0 ? 0 : (100 * yest_cancelled_order_diff)/yesterday_cancelled_orders;

      const yest_completed_order_diff = today_completed_orders - yesterday_completed_orders;
      const completed_order_percentage_diff = yest_completed_order_diff === 0 ? 0 : (100 * yest_completed_order_diff)/yesterday_completed_orders;

      const yest_rejected_order_diff = today_rejected_orders - yesterday_rejected_orders;
      const rejected_order_percentage_diff = yest_rejected_order_diff === 0 ? 0 : (100 * yest_rejected_order_diff)/yesterday_rejected_orders;

      const yest_pending_order_diff = today_pending_orders - yesterday_pending_orders;
      const pending_order_percentage_diff = yest_pending_order_diff === 0 ? 0 : (100 * yest_pending_order_diff)/yesterday_pending_orders;

      const rejected_order_percentage = rejected_orders === 0 ? 0 : (100 * rejected_orders)/all_orders;
      const cancelled_order_percentage = cancelled_orders === 0 ? 0 : (100 * cancelled_orders)/all_orders;
      const completed_order_percentage = completed_orders === 0 ? 0 : (100 * completed_orders)/all_orders;
      const all_order_percentage = all_orders === 0 ? 0 : (100 * all_orders)/all_orders;
      const pending_order_percentage = pending_orders === 0 ? 0 : (100 * pending_orders)/all_orders;
      const results = {
        all_orders,
        completed_orders,
        cancelled_orders,
        rejected_orders,
        pending_orders,
        rejected_orders_percentage: `${rejected_order_percentage.toFixed(1)}%`,
        cancelled_orders_percentage: `${cancelled_order_percentage.toFixed(1)}%`,
        completed_orders_percentage: `${completed_order_percentage.toFixed(1)}%`,
        pending_orders_percentage: `${pending_order_percentage.toFixed(1)}`,
        all_orders_percentage: `${all_order_percentage.toFixed(1)}%`,
        rejected_orders_from_yesterday: `${rejected_order_percentage_diff.toFixed(1)}%`,
        completed_orders_from_yesterday: `${completed_order_percentage_diff.toFixed(1)}%`,
        cancelled_orders_from_yesterday: `${yest_cancelled_order_percentage_diff.toFixed(1)}%`,
        all_orders_from_yesterday: `${yest_all_order_percentage_diff.toFixed(1)}%`,
        pending_orders_from_yesterday: `${pending_order_percentage_diff.toFixed(1)}%`
      }
      return res.json(success("Success", results, res.statusCode));
    } else if (date_filter.toString().toLowerCase() === "last 7d") {
      const now = new Date();
      const last_7_days = new Date(new Date().setDate(new Date().getDate() - 6));
      const start_date = new Date(last_7_days.setHours(0o0, 0o0, 0o0));
      const end_date = new Date(now.setHours(23, 59, 59));

      const today_start_date = new Date(new Date().setHours(0o0, 0o0, 0o0));
      const today_end_date = new Date(new Date().setHours(23, 59, 59));
      const all_orders = await Order.countDocuments({
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });
      const cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      // ------------------------------------------------------ yesterday -----------------------
      const yest_all_orders = await Order.countDocuments({
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });
      const yest_cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      // ------------------------------------------------------

      const today_all_orders = await Order.countDocuments({
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });
      const today_cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const rejected_order_percentage = rejected_orders === 0 ? 0 : (100 * rejected_orders)/all_orders;
      const cancelled_order_percentage = cancelled_orders === 0 ? 0 : (100 * cancelled_orders)/all_orders;
      const completed_order_percentage = completed_orders === 0 ? 0 : (100 * completed_orders)/all_orders;
      const all_order_percentage = all_orders === 0 ? 0 : (100 * all_orders)/all_orders;
      const pending_order_percentage = pending_orders === 0 ? 0 : (100 * pending_orders)/all_orders;

      const yest_all_order_diff = today_all_orders - yest_all_orders;
      const yest_all_order_percentage_diff = yest_all_order_diff === 0 ? 0 : (100 * yest_all_order_diff)/yest_all_order_diff;

      const yest_pending_order_diff = today_pending_orders - yest_pending_orders;
      const yest_pending_order_percentage_diff = yest_pending_order_diff === 0 ? 0 : (100 * yest_pending_orders)/yest_pending_orders;

      const yest_cancelled_order_diff = today_cancelled_orders - yest_cancelled_orders;
      const yest_cancelled_order_percentage_diff = yest_cancelled_order_diff === 0 ? 0 : (100 * yest_cancelled_order_diff)/yest_cancelled_orders;

      const yest_completed_order_diff = today_completed_orders - yest_completed_orders;
      const completed_order_percentage_diff = yest_completed_order_diff === 0 ? 0 : (100 * yest_completed_order_diff)/yest_completed_orders;

      const yest_rejected_order_diff = today_rejected_orders - yest_rejected_orders;
      const rejected_order_percentage_diff = yest_rejected_order_diff === 0 ? 0 : (100 * yest_rejected_order_diff)/yest_rejected_orders;

      const results = {
        all_orders,
        completed_orders,
        cancelled_orders,
        rejected_orders,
        pending_orders,
        rejected_orders_percentage: `${rejected_order_percentage.toFixed(1)}%`,
        cancelled_orders_percentage: `${cancelled_order_percentage.toFixed(1)}%`,
        completed_orders_percentage: `${completed_order_percentage.toFixed(1)}%`,
        pending_orders_percentage: `${pending_order_percentage.toFixed(1)}`,
        all_orders_percentage: `${all_order_percentage.toFixed(1)}%`,
        all_orders_from_yesterday: `${yest_all_order_percentage_diff.toFixed(1)}%`,
        rejected_orders_from_yesterday: `${rejected_order_percentage_diff.toFixed(1)}%`,
        completed_orders_from_yesterday: `${completed_order_percentage_diff.toFixed(1)}%`,
        cancelled_orders_from_yesterday: `${yest_cancelled_order_percentage_diff.toFixed(1)}%`,
        pending_orders_from_yesterday: `${yest_pending_order_percentage_diff.toFixed(1)}%`
      }
      return res.json(success("Success", results, res.statusCode));
    } else if (date_filter.toString().toLowerCase() === "last 30d") {
      const now = new Date();
      const last_30_days = new Date(new Date().setDate(new Date().getDate() - 29));
      const start_date = new Date(last_30_days.setHours(0o0, 0o0, 0o0));
      const end_date = new Date(now.setHours(23, 59, 59));
      const today_start_date = new Date(new Date().setHours(0o0, 0o0, 0o0));
      const today_end_date = new Date(new Date().setHours(23, 59, 59));
      const all_orders = await Order.countDocuments({
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });
      const cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const yest_all_orders = await Order.countDocuments({
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });
      const yest_cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      // ------------------------------------------------------

      const today_all_orders = await Order.countDocuments({
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });
      const today_cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const yest_all_order_diff = today_all_orders - yest_all_orders;
      const yest_all_order_percentage_diff = yest_all_order_diff === 0 ? 0 : (100 * yest_all_order_diff)/yest_all_orders;

      const yest_cancelled_order_diff = today_cancelled_orders - yest_cancelled_orders;
      const yest_cancelled_order_percentage_diff = yest_cancelled_order_diff === 0 ? 0 : (100 * yest_cancelled_order_diff)/yest_cancelled_orders;

      const yest_completed_order_diff = today_completed_orders - yest_completed_orders;
      const completed_order_percentage_diff = yest_completed_order_diff === 0 ? 0 : (100 * yest_completed_order_diff)/yest_completed_orders;

      const yest_rejected_order_diff = today_rejected_orders - yest_rejected_orders;
      const rejected_order_percentage_diff = yest_rejected_order_diff === 0 ? 0 : (100 * yest_rejected_order_diff)/yest_rejected_orders;

      const yest_pending_order_diff = today_pending_orders - yest_pending_orders;
      const pending_order_percentage_diff = yest_pending_order_diff === 0 ? 0 : (100 * yest_pending_orders)/yest_pending_orders;

      const rejected_order_percentage = rejected_orders === 0 ? 0 : (100 * rejected_orders)/all_orders;
      const cancelled_order_percentage = cancelled_orders === 0 ? 0 : (100 * cancelled_orders)/all_orders;
      const completed_order_percentage = completed_orders === 0 ? 0 : (100 * completed_orders)/all_orders;
      const all_order_percentage = all_orders === 0 ? 0 : (100 * all_orders)/all_orders;
      const pending_order_percentage = pending_orders === 0 ? 0 : (100 * pending_orders)/all_orders;
      const results = {
        all_orders,
        completed_orders,
        cancelled_orders,
        rejected_orders,
        pending_orders,
        pending_orders_percentage: `${pending_order_percentage.toFixed(1)}`,
        rejected_orders_percentage: `${rejected_order_percentage.toFixed(1)}%`,
        cancelled_orders_percentage: `${cancelled_order_percentage.toFixed(1)}%`,
        completed_orders_percentage: `${completed_order_percentage.toFixed(1)}%`,
        all_orders_percentage: `${all_order_percentage.toFixed(1)}%`,
        all_orders_from_yesterday: `${yest_all_order_percentage_diff.toFixed(1)}%`,
        rejected_orders_from_yesterday: `${rejected_order_percentage_diff.toFixed(1)}%`,
        completed_orders_from_yesterday: `${completed_order_percentage_diff.toFixed(1)}%`,
        cancelled_orders_from_yesterday: `${yest_cancelled_order_percentage_diff.toFixed(1)}%`,
        pending_orders_from_yesterday: `${pending_order_percentage_diff.toFixed(1)}%`
      }
      return res.json(success("Success", results, res.statusCode));
    } else if (regex.test(date_filter.toString())) {
      const now = new Date(date_filter.toLocaleString());
      
      const start_date = new Date(now.setDate(1));
      const today_start_date = new Date(new Date().setHours(0o0, 0o0, 0o0));
      const today_end_date = new Date(new Date().setHours(23, 59, 59));
      const end_date = last_day_of_month(now);

      const all_orders = await Order.countDocuments({
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });
      const cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: start_date,
          $lte: end_date
        }
      });

      const yest_all_orders = await Order.countDocuments({
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });
      const yest_cancelled_orders = await Order.countDocuments({
        status: "cancelled",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const yest_rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: yest_start_date,
          $lte: yest_end_date
        }
      });

      const today_all_orders = await Order.countDocuments({
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });
      const today_cancelled_orders = await Order.countDocuments({
        status: "canncelled",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_completed_orders = await Order.countDocuments({
        status: "delivered",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_pending_orders = await Order.countDocuments({
        status: "pending",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const today_rejected_orders = await Order.countDocuments({
        status: "rejected",
        createdAt: {
          $gte: today_start_date,
          $lte: today_end_date
        }
      });

      const yest_all_order_diff = today_all_orders - yest_all_orders;
      const yest_all_order_percentage_diff = yest_all_order_diff === 0 ? 0 : (100 * yest_all_order_diff)/yest_all_orders;

      const yest_cancelled_order_diff = today_cancelled_orders - yest_cancelled_orders;
      const yest_cancelled_order_percentage_diff = yest_cancelled_order_diff === 0 ? 0 : (100 * yest_cancelled_order_diff)/yest_cancelled_orders;

      const yest_completed_order_diff = today_completed_orders - yest_completed_orders;
      const completed_order_percentage_diff = yest_completed_order_diff === 0 ? 0 : (100 * yest_completed_order_diff)/yest_completed_orders;

      const yest_rejected_order_diff = today_rejected_orders - yest_rejected_orders;
      const rejected_order_percentage_diff = yest_rejected_order_diff === 0 ? 0 : (100 * yest_rejected_order_diff)/yest_rejected_orders;

      const yest_pending_order_diff = today_pending_orders - yest_rejected_orders;
      const pending_order_percentage_diff = yest_pending_order_diff === 0 ? 0 : (100 * yest_pending_order_diff)/yest_pending_orders;

      const rejected_order_percentage = rejected_orders === 0 ? 0 : (100 * rejected_orders)/all_orders;
      const cancelled_order_percentage = cancelled_orders === 0 ? 0 : (100 * cancelled_orders)/all_orders;
      const completed_order_percentage = completed_orders === 0 ? 0 : (100 * completed_orders)/all_orders;
      const all_order_percentage = all_orders === 0 ? 0 : (100 * all_orders)/all_orders;
      const pending_order_percentage = pending_orders === 0 ? 0 : (100 * pending_orders)/all_orders;
      const results = {
        all_orders,
        completed_orders,
        cancelled_orders,
        rejected_orders,
        pending_orders,
        rejected_orders_percentage: `${rejected_order_percentage.toFixed(1)}%`,
        cancelled_orders_percentage: `${cancelled_order_percentage.toFixed(1)}%`,
        completed_orders_percentage: `${completed_order_percentage.toFixed(1)}%`,
        pending_orders_percentage: `${pending_order_percentage.toFixed(1)}`,
        all_orders_percentage: `${all_order_percentage.toFixed(1)}%`,
        all_orders_from_yesterday: `${yest_all_order_percentage_diff.toFixed(1)}%`,
        rejected_orders_from_yesterday: `${rejected_order_percentage_diff.toFixed(1)}%`,
        completed_orders_from_yesterday: `${completed_order_percentage_diff.toFixed(1)}%`,
        cancelled_orders_from_yesterday: `${yest_cancelled_order_percentage_diff.toFixed(1)}%`,
        pending_orders_from_yesterday: `${pending_order_percentage_diff.toFixed(1)}%`,
      }
      return res.json(success("Success", results, res.statusCode));
    }
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const search_filter = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { searchTerm, merchant_id } = req.query;
    
    const search_result = await Order.paginate({
      $or: [
        { 
          deliveryAddress: {
            $regex: searchTerm,
            $options: "i"
          },
          restaurantId: merchant_id
        },
        { 
          reference_code: {
            $regex: searchTerm,
            $options: "i"
          },
          restaurantId: merchant_id
        },
        { 
          status: {
            $regex: searchTerm,
            $options: "i"
          }
        },
        { 
          "items.name": {
            $regex: searchTerm,
            $options: "i"
          }
        },
        { 
          "items.description": {
            $regex: searchTerm,
            $options: "i"
          },
          restaurantId: merchant_id
        }
      ]
    }, {
      limit, 
      offset,
      populate: ["items.restaurantId", "userId"],
      sort: { createdAt: -1 }
    });
    
    return res.json(success("Success", search_result, res.statusCode));
  } catch (err: any) {
    console.log(err);
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const admin_dashboard_monthly_earnings = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const month_start = new Date(now.setDate(1))
    const month_end = last_day_of_month(now)
    const last_month = new Date(new Date().setMonth(new Date().getMonth() - 1));
    const last_month_start = new Date(last_month.setDate(1));
    const last_month_end = last_day_of_month(last_month);
    const year_start = new Date(new Date().setMonth(0));
    const year_end = new Date(new Date().setMonth(11));

    const orders = await Order.find({ status: "delivered", 
      createdAt: {
        $gte: new Date(month_start.setHours(0o0, 0o0, 0o0)),
        $lte: new Date(month_end.setHours(23, 59, 59))
      } 
    });
    const this_month_earnings = orders && orders.map(order => order.subtotal).reduce((a, b) => a + b, 0);
    const last_month_orders = await Order.find({ status: "delivered", 
      createdAt: {
        $gte: new Date(last_month_start.setHours(0o0, 0o0, 0o0)),
        $lte: new Date(last_month_end.setHours(23, 59, 59))
      } 
    });
    const last_month_earnings = last_month_orders && last_month_orders.map(order => order.subtotal).reduce((a, b) => a + b, 0);
    const this_year_orders = await Order.find({ status: "delivered", createdAt: {
      $gte: new Date(year_start.setHours(0o0, 0o0, 0o0)),
      $lte: new Date(year_end.setHours(23, 59, 59))
    }})

    const chart_result = annual_chart(this_year_orders);
    const data = {
      this_month_earnings: this_month_earnings.toFixed(2),
      last_month_earnings: last_month_earnings.toFixed(2),
      chart_result
    }
    return res.json(success("Success", data, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const admin_order_list_by_status = async (req: Request, res: Response) => {
  try {
    const { limit, offset } = pagination(req.query);
    const { status } = req.query;
    const orders = await Order.paginate({ status }, { limit, offset, populate: ["restaurantId"], sort: { createdAt: -1 }});
    return res.json(success("Success", orders, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}