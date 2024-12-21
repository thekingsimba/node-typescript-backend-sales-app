import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { Merchant } from "./merchant.schema";
import { success, error } from "../../config/response";
import { Request, Response } from "express";
import { paginated_data, pagination } from "../../middleware/pagination";
import key from "../../config/key";
import { IMerchantData, IRating, Ibanner } from "./merchant.interface";
import { Role } from "../../controllers/role/role.schema";
import { dynamic_template_data } from "../../utils/template";
import { sendEmail } from "../../utils/mailer";
import Logger from "../../utils/logger";
import { Order } from "../../controllers/order/order.schema";
import { annual_chart } from "../../utils/chart";
import { sendSMS, sms_code } from "../../utils/sms";
import moment from "moment";
import { isValidObjectId } from "mongoose";
import path from 'path';
import { OTP } from "controllers/otp/otp.schema";

require("dotenv").config({ path: path.resolve(__dirname + "/../../../.env") });


const stripe = new Stripe(key.STRIPE_KEY, { "apiVersion": "2022-11-15"  });

export const createMerchant = async (req: Request, res: Response) => { 
  try {
    const regex = /\S+@\S+\.\S+/;
    if (!req.body.first_name) return res.status(400).json(error("Your first name is required", res.statusCode));
    if (!req.body.last_name) return res.status(400).json(error("Your last name is required", res.statusCode));
    if (!regex.test(req.body.email)) return res.status(400).json(error("Invalid email address", res.statusCode));
    if (!req.body.phone_number) return res.status(400).json(error("Phone number is required", res.statusCode));
    if (!req.body.merchant_type) return res.status(400).json(error("Business category is required", res.statusCode));
    if (!req.body.password) return res.status(400).json(error("Your first name is required", res.statusCode));
    if (!req.body.restaurant_name) return res.status(400).json(error("Password field is required", res.statusCode));
    if (!req.body.line_1) return res.status(400).json(error("Address line 1 field is required", res.statusCode));
    if (!req.body.post_code) return res.status(400).json(error("Post code is required", res.statusCode));
    if (!req.body.country) return res.status(400).json(error("Country field is required", res.statusCode));
    if (!req.body.latitude) return res.status(400).json(error("Location latitude is required", res.statusCode));
    if (!req.body.longitude) return res.status(400).json(error("Location latitude is required", res.statusCode));
    const data: IMerchantData = req.body
    const { latitude, longitude } = data;
    const address = {
      line_1: data.line_1, line_2: data.line_2, post_code: data.post_code, country: data.country
    }
    
    const role = await Role.findOne({ name: "merchant" });
    const slug = req.body.restaurant_name.split(" ").join("-");
    const coordinates = [ longitude, latitude ];
    const type = "Point";
    const location = {
      type,
      coordinates
    };
    const merchant_found = await Merchant.findOne({ email: data.email });
    if (merchant_found) return res.status(400).json(error("Email already exists", res.statusCode));
    const hash = bcrypt.hashSync(data.password, 12);
    let merchant = new Merchant({ 
      first_name: data.first_name, 
      last_name: data.last_name, 
      email: data.email, 
      phone_number: data.phone_number, 
      password: hash, 
      restaurant_name: data.restaurant_name, 
      address,
      location,
      slug: slug.toLowerCase(),
      store_link: `${req.protocol}://${req.hostname}/${slug.toLowerCase()}`,
      merchant_type: data.merchant_type,
      role: {
        role_id: role && role._id,
        role_name: role && role.name
      },
    });

    const account = await stripe.accounts.create({
      country: 'GB',
      type: 'express',
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
      business_type: 'individual',
      business_profile: {
        url:  process.env.MAIN_SERVER_URL,
      },
    });
    if (account && !account.id) return res.status(400).json(error("We could not create your account due to Stripe failure. Please contact our support", res.statusCode));
    merchant.stripe_account_id = account?.id;
    merchant = await merchant.save();
      
    const mail_data = dynamic_template_data({email: merchant.email, template_id: process.env.MERCHANT_EMAIL_TEMPLATE_ID, data: { first_name: merchant.first_name } });
    sendEmail(mail_data);
    return res.json(success("Success", merchant, res.statusCode));
    
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please try again later", res.statusCode));
  }
}

export const verify_phone_number = async (req: Request, res: Response) => {
  try {
    let otp = await OTP.findOne({ verification_code: req.body.code, otp_expires: { $gte: new Date() }});
    if (!otp) return res.status(400).json(error("Invalid code or code has expired", res.statusCode));
    await OTP.findByIdAndDelete(otp._id);
    const data = { message: "Phone number verified" }
    return res.json(success("Success", data, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const verify_email = async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findByIdAndUpdate({ _id: req.body.merchant_id }, { $set: { email_verified: true, verification_status: true }}, { new: true });
    if (!merchant) return res.status(400).json(error("Merchant account not found", res.statusCode));
    return res.json(success("Success", { message: "Email verified!"}, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const get_otp = async (req: Request, res: Response) => {
  try {
    const code: string = sms_code();
    let otp = new OTP({ verification_code: code, otp_expires: moment(new Date()).add(5, "minutes")});
    if (!otp) return res.status(400).json(error("Phone number not found!", res.statusCode));
    const sms = await sendSMS({
      message: `Your verification code is: ${code}`,
      to: req.body.phone_number,
    });

    await otp.save();
    if (sms && !sms.sid) return res.status(400).json(error(`We could not send OTP to ${req.body.phone_number}`, res.statusCode));
    const data = {
      message: `We have sent a phone number verification code to your ${req.body.phone_number}`
    }
    return res.json(success("Success", data, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode))
  }
}


export const login = async (req: Request, res: Response) => {
  try {
    let isMerchant = await Merchant.findOne({ email: req.body.email }).populate("merchant_type");
    if (!isMerchant) return res.status(404).json(error("User does not exist", res.statusCode));
    let slug = isMerchant.slug;
    let store_link = isMerchant.store_link;
    if (!slug || !store_link) {
      slug = isMerchant.restaurant_name.split(" ").join("-");
      isMerchant.store_link = `${req.protocol}://${req.hostname}/${slug.toLowerCase()}`
      isMerchant.slug = slug.toLowerCase();
      await isMerchant.save();
    }
    const isMatched = bcrypt.compareSync(req.body.password, isMerchant.password);
    if (!isMatched) return res.status(400).json(error("Invalid password", res.statusCode));
    const { 
      first_name, 
      last_name, 
      email, 
      _id, 
      phone_number, 
      address, role, 
      merchant_type,
      bank_details,
      restaurant_name,
      verification_status, 
      status,
      image_url,
      last_status_update_at,
      averageRating,
    } = isMerchant;
    const token = jwt.sign({ 
      _id, 
      email, 
      first_name, 
      role, 
      merchant_type,
      slug
    }, key.SECRET, { expiresIn: "30 days" });
    res.cookie("token", `Bearer ${token}`, { expires: new Date(new Date().getDate() + 64800000)});
    return res.header("authorization", `Bearer ${token}`).json(success("Login success!", {
      token, merchant: { first_name, last_name, email, _id, phone_number, address, role,
      merchant_type,
      bank_details,
      verification_status,
      restaurant_name,
      status,
      image_url,
      averageRating,
      last_status_update_at,
      slug,
    }}, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const approve_merchant = async (req: Request, res: Response) => {
  try {
    const { status, merchant_id } = req.body;
    const merchant = await Merchant.findByIdAndUpdate(merchant_id, { $set: { verification_status: "verified" }}, { new: true });
    if (!merchant) return res.status(404).json(error("Account not found", res.statusCode));
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const getList = async (req: Request, res: Response) => {
  try {
    let { limit, offset } = pagination(req.query);
    const merchants = await Merchant.paginate({}, {limit, offset, populate: [ "food_category", "merchant_type" ]});

    return res.json(success("Success", merchants, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const get_store_by_name = async (req: Request, res: Response) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json(error("Query parameter SLUG is not provided", res.statusCode));
    const name = slug.toString().split("-")
    const result = await Merchant.findOne({ slug })
      .populate("food_category")
      .populate("merchant_type")
      .populate("ratings.userId", "full_name email phone picture");
    if (!result) return res.status(404).json(error(`The store ${name} not found`, res.statusCode));
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const restaurant_details = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    const merchant = await Merchant.findById({ _id: id }).populate("food_category").populate("merchant_type");
    if (!merchant) return res.status(400).json(error("Merchant records not found", res.statusCode));
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const update_restaurant = async (req: Request, res: Response) => {
  try {
    const { id, role, first_name, last_name, email, phone_number, restaurant_name, line_1, line_2, post_code, country, longitude, latitude } = req.body;
    let merchant_role;
    if (role) {
      merchant_role = await Role.findOne({ name: "merchant"});
    }
    
    let merchant = await Merchant.findById({ _id: id });
    if (!merchant) return res.status(400).json(error("Restaurant does not exist", res.statusCode));
    let coordinates;
    if (longitude && latitude) {
      coordinates = [longitude, latitude]
    }
    if (first_name) merchant.first_name = first_name;
    if (last_name) merchant.last_name = last_name;
    if (email) merchant.email = email;
    if (phone_number) merchant.phone_number = phone_number;
    if (restaurant_name) merchant.restaurant_name = restaurant_name;
    if (line_1) merchant.address.line_1 = line_1;
    if (line_2) merchant.address.line_2 = line_2;
    if (post_code) merchant.address.post_code = post_code;
    if (country) merchant.address.country = country;
    if (req.body.image_url) merchant.image_url = req.body.image_url;
    if (req.body.merchant_type) merchant.merchant_type = req.body.merchant_type;
    if (merchant_role) merchant.role.role_id = merchant_role._id;
    if (merchant_role) merchant.role.role_name = merchant_role.name;
    if (coordinates && coordinates.length === 2) merchant.location.coordinates = coordinates;

    merchant = await merchant.save();
    return res.json(success("Record updated", merchant, res.statusCode));
  } catch (err: any) {
    console.log(err)
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error("Some thing went wrong. Please try again later", res.statusCode));
  }
}

export const delete_restaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    const restaurant = await Merchant.findByIdAndDelete({ _id: id });
    if (!restaurant) return res.status(404).json(error("Record does not exist", res.statusCode));
    return res.json(success("Record deleted!", restaurant, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const rateMerchant = async (req: Request, res:Response) => {
  try {
    const data: IRating = req.body;
    const { merchantId, userId, rate, review } = data;
    const ratingData = { merchantId, userId, rate, review }
    let food = await Merchant.findByIdAndUpdate({ _id: merchantId }, {$push: { ratings: ratingData }}, { new: true });
    if (!food) return res.status(404).json(error("We could not a any records for this food", res.statusCode));
    const ratings = food.ratings && food.ratings.map(rating => rating.rate);
    const totalRating = ratings.reduce((a, b) => a + b, 0);
    food.averageRating = +((totalRating/ratings.length).toFixed(1));
    food.totalRating = totalRating;
    food = await food.save();
    return res.json(success("Success", food, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const getRatings = async (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    const rating = await Merchant.aggregate([
      { $match: { restaurant_name: name }},
      { $unwind: "$ratings" },
      { $group: { 
        _id: "$_id",
        average: { $avg: "$ratings.rate"},
        totalRating: { $sum: "$ratings.rate"}
      }}
    ]);
    const reviews = await Merchant.findOne({ restaurant_name: { $regex: name, $options: "i" } }).populate("ratings.userId", "full_name picture");

    const result = rating.length > 0 ? rating[0] : {}
    return res.json(success("Success", { rating: result, reviews: reviews }, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const getMerchantRatings = async (req: Request, res: Response) => {
  try {
    const { merchant_id } = req.query;
    const ratings = await Merchant.findById(merchant_id).select("ratings -_id").populate("ratings.userId");
    const fiveRatingsCount = ratings && ratings.ratings.filter(rate => rate.rate === 5);
    const fourRatingsCount = ratings && ratings.ratings.filter(rate => rate.rate === 4);
    const threeRatingsCount = ratings && ratings.ratings.filter(rate => rate.rate === 3);
    const twoRatingsCount = ratings && ratings.ratings.filter(rate => rate.rate === 2)
    const oneRatingsCount = ratings && ratings.ratings.filter(rate => rate.rate === 1);
    const result = {
      ratings: ratings.ratings,
      oneStarRatings: oneRatingsCount.length,
      twoStarRatings: twoRatingsCount.length,
      threeStarRatings: threeRatingsCount.length,
      fourStarRatings: fourRatingsCount.length,
      fiveStarRatings: fiveRatingsCount.length
    }
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    Logger.error(`${JSON.stringify(err)}`)
    return res.status(500).json(error(err.message, res.statusCode));
  }
}


export const merchants_near_you = async (req: Request, res: Response) => {
  try {
    const { limit, page } = req.query;
    const { lat, long, merchant_type, radius } = req.query
    if (!long) return res.status(400).json(error("Longitude is required", res.statusCode)); 
    if (!lat) return res.status(400).json(error("Latitude is required", res.statusCode));
    if (!merchant_type) return res.status(400).json(error("Invalid query parameter: merchant_type", res.statusCode));
    const latitude = +lat, longitude = +long
    const query = {
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [ longitude, latitude ] },
          $maxDistance: radius ? +radius * 1000 : 5000,
        }
      },
      merchant_type,
      "special_offer.has_offer": false,
      verification_status: "verified"
    }
    
    const merchants = await Merchant.find(query).populate("merchant_type").populate("food_category")
    const page_count = page ? page: 1;
    const page_limit = limit ? limit : 20;
    const result = paginated_data(merchants, +page_count, +page_limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err))
    res.status(500).json(error("Something went wrong. Please try again or contact our support for assistance", res.statusCode));
  }
}

export const offers_near_you = async (req: Request, res: Response) => {
  try {
    const { limit, page } = req.query;
    const { lat, long, merchant_type, radius } = req.query
    const latitude = +lat, longitude = +long
    
    const query = {
      "location": {
        $near: {
          $geometry: { type: "Point", coordinates: [ longitude, latitude ] },
          $maxDistance: radius ? +radius * 1000 : 10000,
        }
      },
      merchant_type,
      "special_offer.has_offer": true,
    }
    const merchants = await Merchant.find(query).populate(["food_category", "merchant_type"]); //, { limit, offset, populate: ["food_category", "merchant_type"]}
    const page_count = page ? page: 1;
    const page_limit = limit ? limit : 20;
    const result = paginated_data(merchants, +page_count, +page_limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    console.log(err)
    res.status(500).json(error("Something went wrong. Please try again or contact our support for assistance", res.statusCode));
  }
}

export const set_offers = async (req: Request, res: Response) => {
  try {
    const { merchantId, offer_amount } = req.body;
    const merchant = await Merchant.findByIdAndUpdate({ _id: merchantId }, { $set: { "special_offer.has_offer": true }, $inc: {"special_offer.amount": Number(offer_amount)}}, { new: true});
    if (!merchant) return res.status(404).json(error("No records found", res.statusCode));
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    res.status(500).json(error("Something went wrong. Please try again or contact our support for assistance", res.statusCode));
  }
}

export const end_offers = async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.body;
    const merchant = await Merchant.findByIdAndUpdate({ _id: merchantId }, { $set: { "special_offer.has_offer": false, "special_offer.amount": 0 }}, { new: true});
    if (!merchant) return res.status(404).json(error("No records found", res.statusCode));
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    res.status(500).json(error("Something went wrong. Please try again or contact our support for assistance", res.statusCode));
  }
}

export const notification_setting = async (req: Request, res: Response) => {
  try {
    const { notification_type, status, merchant_id } = req.body;
    let merchant;
    if (notification_type === "live_order") {
      merchant = await Merchant.findByIdAndUpdate(merchant_id, { $set: { live_order_notification: status }}, { new: true });
      if (!merchant) return res.status(400).json(error("Merchant does not exist", res.statusCode));
    } else if (notification_type === "promotion") {
      merchant = await Merchant.findByIdAndUpdate(merchant_id, { $set: { promotion_notification: status }}, { new: true });
      if (!merchant) return res.status(400).json(error("Merchant does not exist", res.statusCode));
    }
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const update_bank_details = async (req: Request, res: Response) => {
  try {
    const { merchant_id, bank_name, account_name, account_number, sort_code } = req.body;
    let merchant = await Merchant.findByIdAndUpdate(merchant_id, { 
      $set: { bank_details: { bank_name, sort_code, account_name, account_number }}}, { new: true });
      if (!merchant) return res.status(400).json(error("Merchant account not found", res.statusCode));
      return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const device_token_update = async (req: Request, res: Response) => {
  try {
    const { merchant_id, device_token } = req.body;
    let merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error("User not found", res.statusCode));
    for (let i = 0; i < merchant.device_token.length; i++) {
      const token = merchant.device_token[i];
      if (token === "" || token === undefined || token === null)
        merchant.device_token.splice(i, 1);
      
      if (token === device_token) return res.status(200).json(success("Success", merchant, res.statusCode));
    }
    merchant.device_token.push(device_token);
    merchant = await merchant.save();
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(`Device token update ${err}`))
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const status_update = async (req: Request, res: Response) => {
  try {
    const { merchant_id, status } = req.body;
    let  merchant;
    if (status.toLowerCase() === "closed") {
      merchant = await Merchant.findByIdAndUpdate(merchant_id, { $set: { status, last_status_update_at: new Date(), manually_closed: true }}, { new: true });
    } else {
      merchant = await Merchant.findByIdAndUpdate(merchant_id, { $set: { status, last_status_update_at: new Date(), manually_closed: false }}, { new: true });
    }
    
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const dashboard_merchant_details = async (req: Request, res: Response) => {
  try {
    let merchant = await Merchant.findById(req.query.id).populate("merchant_type", "name image_url -_id");
    const transactions = await Order.aggregate([
      {
        $addFields: {
          restaurantId: { $toString: "$restaurantId" }
        }
      },
      {
        $match: {
          restaurantId: {
            "$regex": req.query.id,
            "$options": "si"
          },
          status: "delivered"
        }
      },
      // Stage 2: Group remaining documents by pizza name and calculate total quantity
      {
        $group: { _id: null, totalTransaction: { $sum: "$subtotal" } }
      }
    ]);
    const complete_trans = await Order.countDocuments({ restaurantId: req.query.id, status: "delivered" });
    const orders = await Order.find({ restaurantId: req.query.id, status: "delivered" });
    const chart_data = annual_chart(orders)
    const data = {
      merchant,
      totalProcessedTransactions: complete_trans,
      totalTransactions: transactions && transactions[0] && transactions[0].totalTransaction,
      sales_overview: chart_data,
    }
    return res.json(success("Success", data, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const create_stripe_account_link = async (req: Request, res: Response) => {
  try {
    const { merchant_id } = req.body;
    let merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error("Merchant does not exist", res.statusCode));
    const accountLink = await stripe.accountLinks.create({
      account: merchant?.stripe_account_id,
      refresh_url:  process.env.MERCHANT_HUB_REAUTH_URL,
      return_url:  process.env.MERCHANT_HUB_RETURN_URL,
      type: 'account_onboarding',
    });

    if (accountLink?.url) {
      return res.json(success("Success", accountLink, res.statusCode));
    }
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const set_opening_and_closing_time = async (req: Request, res: Response) => {
  try {
    const { operation_days, merchant_id } = req.body;
    let merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error(`We could not find a merchant with the id: ${merchant_id}`, res.statusCode));
    const open_close_time = merchant && merchant.open_close_time;
  
    if (operation_days && operation_days.length > 0) {
      for (let i = 0; i < operation_days.length; i++) {
        const business_day = operation_days[i];
        const dayIndex = open_close_time.findIndex(b => (b.day.toLowerCase() === business_day.day.toLowerCase()));
        if (dayIndex >= 0) return res.status(400).json(error(`You have already set ${business_day.day}`, res.statusCode))
      }
    }
    for (let day of operation_days) {
      merchant.open_close_time.push(day);
    }
    await merchant.save();
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const update_opening_and_closing_time = async (req: Request, res: Response) => {
  try {
    const { status, merchant_id, day_id, day, opening_time, closing_time } = req.body;
    let merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error(`We could not find a merchant with the id: ${merchant_id}`, res.statusCode));
    const open_close_time = merchant && merchant.open_close_time;
    let spread_open_close_time = [...open_close_time];
    let day_index = spread_open_close_time.findIndex((day: any) => day._id.toString() === day_id.toString());
    
    if (day_index >= 0) {
      spread_open_close_time[day_index].status = status ? status : spread_open_close_time[day_index].status;
      spread_open_close_time[day_index].day = day ? day : spread_open_close_time[day_index].day;
      spread_open_close_time[day_index].opening_time = opening_time ? opening_time : spread_open_close_time[day_index].opening_time;
      spread_open_close_time[day_index].closing_time = closing_time ? closing_time : spread_open_close_time[day_index].closing_time;
    }
    
    merchant.open_close_time = spread_open_close_time;
    await merchant.save();
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const stripe_connect_account_status_update = async (req: Request, res: Response) => {
  try {
    const { merchant_id } = req.query;
    const merchant = await Merchant.findByIdAndUpdate(merchant_id, { $set: { connect_account_status: "complete" }}, { new: true });
    if (!merchant) return res.status(400).json(error(`We could find a merchant with ID: ${merchant_id}`, res.statusCode));
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const get_opening_and_closing_time_list = async (req: Request, res: Response) => {
  try {
    const response = await Merchant.findById(req.query.merchant_id).select("open_close_time");
    return res.json(success("Success", response.open_close_time, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const delete_operation_days = async (req: Request, res: Response) => {
  try {
    const { merchant_id } = req.query;
    let merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error(`We could not find a merchant with the id: ${merchant_id}`, res.statusCode));
    merchant.open_close_time = [];
    await merchant.save();
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const delete_operation_day = async (req: Request, res: Response) => {
  try {
    const { merchant_id, day_id } = req.query;
    let merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error(`We could not find a merchant with the id: ${merchant_id}`, res.statusCode));
    const open_close_time = merchant && merchant.open_close_time;
    let spread_open_close_time = [...open_close_time];
    let filtered_operation_days: any = spread_open_close_time.filter((day: any) => day._id.toString() !== day_id.toString());
    merchant.open_close_time = filtered_operation_days;
    await merchant.save();
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const reset_password = async (req: Request, res: Response) => {
  try {
    const { old_password, new_password, merchant_id } = req.body;
    let merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error("Merchant does exist", res.statusCode));
    const old_password_matched = bcrypt.compareSync(old_password, merchant.password);
    if (!old_password_matched) return res.status(400).json(error("Your old password is not correct. Please check and try again", res.statusCode));
    const hash = bcrypt.hashSync(new_password, 12);
    merchant.password = hash;
    await merchant.save();
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const fsa_inspection_details = async (req: Request, res: Response) => {
  try {
    const {
      fsa_inspection_certificate,
      fsa_fhr_image,
      fsa_current_rating_written,
      fsa_last_updated_date,
      fsa_awaiting_inspection_doc,
      fsa_scheduled_inspection_date,
    } = req.body;
    let merchant = await Merchant.findById(req.body.merchant_id);
    if (!merchant) return res.status(404).json(error("No account found with the ID provided", res.statusCode));
    if (fsa_inspection_certificate) merchant.fsa_inspection_certificate = fsa_inspection_certificate
    if (fsa_fhr_image) merchant.fsa_fhr_image = fsa_fhr_image
    if (fsa_current_rating_written) merchant.fsa_current_rating_written = fsa_current_rating_written
    if (fsa_last_updated_date) merchant.fsa_last_updated_date = fsa_last_updated_date
    if (fsa_awaiting_inspection_doc) merchant.fsa_awaiting_inspection_doc = fsa_awaiting_inspection_doc
    if (fsa_scheduled_inspection_date) merchant.fsa_scheduled_inspection_date = fsa_scheduled_inspection_date

    await merchant.save();
    return res.json(success("Success", {message: "FSA information updated!" }, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const about_info = async (req: Request, res: Response) => {
  try {
    const { about, customer_note } = req.body;
    let merchant = await Merchant.findById(req.body.merchant_id);
    if (!merchant) return res.status(404).json(error("No account found with the ID provided", res.statusCode));
    if (about) merchant.about = about;
    if (customer_note) merchant.customer_note = customer_note;

    await merchant.save();
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const get_stripe_customer_details = async (req: Request, res: Response) => {
  try {
    const { merchant_id } = req.query;
    const merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(404).json(error("User does not exist", res.statusCode));
    const customer = await stripe.customers.listPaymentMethods(
      merchant.stripe_account_id,
      {
        limit: 3,
      }
    );
    if (!customer) return res.status(400).json(error("No Stripe account found for this account", res.statusCode));
    return res.json(success("Success", customer, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err.message));
    return res.status(404).json(error(err.message, res.statusCode));
  }
}

export const retrieve_transaction_history = async (req: Request, res: Response) => {
  try {
    const { limit, merchant_id } = req.query;
    if (!merchant_id || !isValidObjectId(merchant_id)) return res.status(400).json(error("Invalid merchant ID", res.statusCode));
    const merchant = await Merchant.findById(merchant_id);
    if (!merchant) return res.status(400).json(error("Merchant account not found", res.statusCode));
    const charges = await stripe.payouts.list({
      limit: +limit
    }, {stripeAccount: merchant.stripe_account_id,});

    return res.json(success("Success", charges, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err.message));
    return res.status(4500).json(error(err.message, res.statusCode));
  }
}

export const add_banner_image = async (req: Request, res: Response) => {
  try {
    const { banner_image } = req.body;
    if (!banner_image) return res.status(400).json(error("Banner image is required", res.statusCode));
    const data: Ibanner = req.body;
    let merchant = await Merchant.findByIdAndUpdate({ _id: data.merchant_id }, { $set: { banner_image: data.banner_image }}, { new: true });
    if (!merchant) return res.json(error("Merchant not found", res.statusCode));
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err.response));
    return res.status(500).json(error("Some went wrong. Please try again or contact our support", res.statusCode));
  }
}

export const fhr_image_update = async (req: Request, res: Response) => {
  try {
    const { image, last_updatedAt, merchant_id} = req.body;
    if (!image) return res.status(400).json(error("Food Hygene Rating image is required", res.statusCode));
    if (!last_updatedAt) return res.status(400).json(error("Food Hygene Rating last updated date is required", res.statusCode));
    const data = {
      image,
      last_updatedAt
    }

    let merchant = await Merchant.findByIdAndUpdate({ _id: merchant_id }, { $set: { fhr_image: data }}, { new: true });
    if (!merchant) return res.json(error("Merchant not found", res.statusCode));
    return res.json(success("Success", merchant, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err.response));
    return res.status(500).json(error("Some went wrong. Please try again or contact our support", res.statusCode));
  }
}