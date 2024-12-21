import { User } from "./users.schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import moment from "moment";
import { success, error } from "../../config/response";
import { Request, Response } from "express";
import { IAddress, IUserCreate } from "./user.interface";
import key from "../../config/key";
import { paginated_data, pagination } from "../../middleware/pagination";
import { sendSMS, sms_code } from "../../utils/sms";
import { Role } from "../../controllers/role/role.schema";
import Logger from "../../utils/logger";
import { last_day_of_month } from "../../utils/util";
import { Order } from "../../controllers/order/order.schema";
import { last_year_data } from "../../utils/chart";
import { fetch } from "utils/fetch";

const stripe = new Stripe(key.STRIPE_KEY, { "apiVersion": "2022-11-15" });

export const social_auth = async (req: Request, res: Response) => {
  try {
    const data: IUserCreate = req.body;
    if (!data.login_type) return res.status(400).json(error("Login type is required.", res.statusCode));
    const user_role = await Role.findOne({ name: "user" });
    const now = new Date();
    const expires_at = new Date(now.setDate(now.getDate() + 30));
    let userExists = await User.findOne({ email: data.email, firebase_token: data.firebase_token });
    if (!userExists) {
      const code = sms_code();
      let user = new User({ 
        full_name: data.full_name, 
        email: data.email,
        phone: data.phone, 
        picture: data.picture,
        verification_code: code,
        otp_expires: moment(new Date()).add(5, "minutes"),
        permission: ["createOwn", "readOwn", "readAny", "updateOwn"],
        role: user_role?._id,
        firebase_token: data.firebase_token,
        login_type: data.login_type,
      });

      // Creating customer stripe record
      const customer = await stripe.customers.create({
        description: 'Consumer app stripe customer',
        email: data.email,
        name: data.full_name,
        phone: data.phone
      });

      if (customer && customer.email !== data.email) return res.status(200).json(error("We could not create your account due to error from stripe. Please try again", res.statusCode));
      user.stripe_id = customer.id;
      user = await user.save();
      const { full_name, phone, email, _id, picture, role, stripe_id } = user;
      const token = jwt.sign({ _id, email, full_name, role }, key.SECRET, { expiresIn: "30d" });
      res.cookie("token", `Bearer ${token}`, { expires: new Date(new Date().getDate() + 64800000)});
      return res.header("authorization", `Bearer ${token}`).json(success("Login success!", { 
        token, expires_at, user: { full_name, email, _id, phone, picture, role, stripe_id,
      }}, res.statusCode));
    }
    
    userExists.login_type = req.body.login_type;
    await userExists.save()
    const { full_name, phone, email, _id, picture, role, stripe_id } = userExists;
    const token = jwt.sign({ _id, email, full_name, role }, key.SECRET, { expiresIn: "30 days" });
    res.cookie("token", `Bearer ${token}`, { expires: new Date(new Date().getDay() + 30)});
    return res.header("authorization", `Bearer ${token}`).json(success("Login success!", { 
      token, expires_at, user: { full_name, email, _id, phone, picture, role, stripe_id
    }}, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support", res.statusCode));
  }
}

export const email_signup = async (req: Request, res: Response) => {
  try {
    const data: IUserCreate = req.body;
    const user = await User.findOne({ email: data.email });
    const role = await Role.findOne({ name: "user" });
    if (user) return res.status(400).json(error("Email already exists", res.statusCode));
    const code = sms_code();
    const hash = bcrypt.hashSync(data.password, 12);
    let newUser = new User({ 
      full_name: data.full_name, 
      email: data.email, 
      password: hash, 
      phone: data.phone, 
      picture: data.picture, 
      verification_code: code,
      role: role?._id,
      otp_expires: moment(new Date()).add(5, "minutes")
    });

    // Creating customer stripe record
    const customer = await stripe.customers.create({
      description: 'Consumer app stripe customer',
      email: data.email.toLowerCase().trim(),
      name: data.full_name,
      phone: data.phone.trim()
    });

    if (customer && customer.email !== data.email) return res.status(400).json(error("We could not create your account due to error from stripe. Please try again", res.statusCode));
    newUser.stripe_id = customer.id;
    newUser = await newUser.save();
    const now = new Date();
    const expires_at = new Date(now.setDate(now.getDate() + 30));
    const { full_name, phone, email, _id, picture, stripe_id } = newUser;
    const token = jwt.sign({ _id, email, full_name, role }, key.SECRET, { expiresIn: "30d" });
    res.cookie("token", `Bearer ${token}`, { expires: new Date(new Date().getDate() + 64800000)});
    return res.header("authorization", `Bearer ${token}`).json(success("Login success!", { 
      token, expires_at, user: { full_name, email, _id, phone, picture, role, stripe_id,
    }}, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err))
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const email_validation = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) return res.status(200).json(success("Success", user, res.statusCode));
    if (!user) return res.status(404).json(error("User does not exist", res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const resend_otp = async (req: Request, res: Response) => {
  try {
    const code: string = sms_code();
    let user = await User.findOneAndUpdate({ phone: req.body.phone }, { 
      $set: { verification_code: code, otp_expires: moment(new Date()).add(5, "minutes")}
    }, { new: true });
    if (!user) return res.status(400).json(error("Phone number not found!", res.statusCode));
    
    const sms = await sendSMS({
      message: `Your verification code is: ${code}`,
      to: user && user.phone,
    });

    user.verification_code = code;
    await user.save();
    if (sms && !sms.sid) return res.status(400).json(error(`We could not send OTP to ${user.phone}`, res.statusCode));
    
    return res.json(success("Success", { message: `We have sent a phone number verification code to your ${user.phone}`}, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode))
  }
}

export const verify_phone_number = async (req: Request, res: Response) => {
  try {
    let user = await User.findOne({ verification_code: req.body.code, otp_expires: { $gte: new Date() }});
    if (!user) return res.status(400).json(error("Invalid code or code has expired", res.statusCode));
    user.verification_code = null;
    user.phone_verified = true;
    user = await user.save();
    const { full_name, phone, phone_verified, email, _id, picture, stripe_id } = user;
    const token = jwt.sign({ _id, email, phone_verified, full_name }, key.SECRET, { expiresIn: "30 days" });
    res.cookie("token", `Bearer ${token}`, { expires: new Date(new Date().getDate() + 64800000)});
    return res.header("authorization", `Bearer ${token}`).json(success("Login success!", { 
      token, user: { full_name, email, _id, phone, picture, stripe_id
    }}, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const email_login = async (req: Request, res: Response) => {
  try {
    let userExists = await User.findOne({ email: req.body.email });
    if (!userExists) return res.status(404).json(error("User does not exist", res.statusCode));
    const isMatched = bcrypt.compareSync(req.body.password, userExists.password);
    if (!isMatched) return res.status(400).json(error("Invalid password", res.statusCode));
    const now = new Date();
    const expires_at = new Date(now.setDate(now.getDate() + 30));
    const { full_name, email, _id, phone, phone_verified, role, stripe_id } = userExists;
    const token = jwt.sign({ _id, email, full_name, role }, key.SECRET, { expiresIn: "30 days" });
    res.cookie("token", `Bearer ${token}`, { expires: new Date(new Date().getDate() + 64800000)});
    userExists.login_type = req.body.login_type;
    await userExists.save();
    return res.header("authorization", `Bearer ${token}`).json(success("Login success!", { 
      token, expires_at, user: { full_name, email, _id, phone_verified, phone, role, stripe_id 
    }}, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const userList = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const users = await User.find({});
    const result = paginated_data(users, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const userDetails = async (req: Request, res: Response) => {
  try {
    const user = await User.findById({ _id: req.query.id });
    if (!user) return res.status(404).json(error("User does not exist", res.statusCode));
    return res.json(success("Success", user, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    let updatedUser = await User.findByIdAndUpdate({ _id: req.body.id }, req.body, { new: true });
    if (!updatedUser) return res.status(404).json(error("User does not exist", res.statusCode));
    return res.json(success("Success", updatedUser, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const deletedUser = await User.findByIdAndDelete({ _id: req.query.id });
    if (!deletedUser) return res.status(404).json(error("User does not exist", res.statusCode));
    return res.json(success("Success", deletedUser, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const add_stripe_id = async (req: Request, res: Response) => {
  try {
    let user = await User.findById(req.body.id);
    if (!user) return res.status(404).json(error("User not found", res.statusCode));
    user = await User.findByIdAndUpdate(req.body.id, { $set: { stripe_id: req.body.stripe_id }}, { new: true });
    return res.json(success("Success", user, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const add_address = async (req: Request, res: Response) => {
  try {
    const data: IAddress = req.body;
    const user = await User.findByIdAndUpdate(data.user_id, { $set: { address: data }}, { new: true });
    if (!user) return res.status(404).json(error("User not found", res.statusCode));
    const address = user && user.address;
    return res.json(success("Success", address, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const get_user_address = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.query.user_id).select("address -_id");
    return res.json(success("Success", user, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const device_token_update = async (req: Request, res: Response) => {
  try {
    const { user_id, device_token } = req.body;
    let user = await User.findById(user_id);
    if (!user) return res.status(404).json(error("User not found", res.statusCode));
    for (let token of user.device_token) {
      if (token === device_token) return res.status(200).json(success("Success", user, res.statusCode));
    }
    user.device_token.push(device_token);
    await user.save();
    return res.json(success("Success", user, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const getAllUserTokens = async () => {
  try {
    const users = await User.find({}, 'device_token');
    // console.log(users);
    const allTokens = users.reduce((tokens, user) => {
      if (user.device_token && user.device_token.length > 0) {
        tokens.push(...user.device_token);
      }
      return tokens;
    }, []);

    return allTokens;
  } catch (error) {
    console.error('Error fetching device tokens:', error);
    throw error;
  }
};

export const customer_db_list = async (req: Request, res: Response) => {
  try {
    const { date_filter } = req.query;
    const regex = /\d{1,2}\/\d{1,2}\/\d{2,4}/
    const now = new Date()
    const last_month = new Date(now.setMonth(now.getMonth() - 1));
    const last_month_start = new Date(last_month.setDate(1));
    const last_month_end = last_day_of_month(last_month);

    const this_month = new Date(now.setMonth(now.getMonth()));
    const this_month_start = new Date(this_month.setDate(1));
    const this_month_end = last_day_of_month(this_month)

    if (date_filter.toString().toLowerCase() === "this month") {
      const user_count = await User.countDocuments({});

      const last_month_total_users = await User.countDocuments({
        createdAt: { 
          $gte: new Date(last_month_start.setHours(0o0, 0o0, 0o0)), 
          $lte: new Date(last_month_end.setHours(23, 59, 59))
        }
      });

      const this_month_total_users = await User.countDocuments({
        createdAt: { 
          $gte: new Date(this_month_start.setHours(0o0, 0o0, 0o0)), 
          $lte: new Date(this_month_end.setHours(23, 59, 59))
        }
      });

      const total_user_diff = this_month_total_users - last_month_total_users;
      const total_user_percentage_from_last_month = ((100 * total_user_diff)/last_month_total_users).toFixed(2);
     
      // active users
      const active_users = await User.countDocuments({ last_order_date: { $lt: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000) }});

      const last_month_total_active_users = await User.countDocuments({
        last_order_date: { $gt: new Date(last_month_end.getTime() - 90 * 24 * 60 * 60 * 1000) }
      });

      const this_month_total_active_users = await User.countDocuments({
        last_order_date: {
          $gt: new Date(this_month_end.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });

      const active_user_diff = +this_month_total_active_users - +last_month_total_active_users
      const active_user_percentage_from_last_month = active_user_diff === 0 ? "0.00" : ((100 * active_user_diff)/last_month_total_active_users).toFixed(2);

      // inactive users
      const inactive_users = await User.countDocuments({ last_order_date: { $gte: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000) }});

      const last_month_total_inactive_users = await User.countDocuments({
        last_order_date: { $lte: new Date(last_month_end.getTime() - 90 * 24 * 60 * 60 * 1000) }
      });

      const this_month_total_inactive_users = await User.countDocuments({
        last_order_date: {
          $lte: new Date(this_month_end.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });
      
      const inactive_user_diff = +this_month_total_inactive_users - +last_month_total_inactive_users
      const inactive_user_percentage_from_last_month = inactive_user_diff === 0 ? "0.00" : ((100 * inactive_user_diff)/last_month_total_inactive_users)
      const response = {
        total_customers: user_count,
        active_users,
        inactive_users,
        total_user_percentage_from_last_month: `${total_user_percentage_from_last_month}%`,
        active_user_percentage_from_last_month: `${active_user_percentage_from_last_month}%`,
        inactive_user_percentage_from_last_month: `${inactive_user_percentage_from_last_month}%`
      }
     
      return res.json(success("Success", response, res.statusCode));
    } else if (date_filter.toString().toLowerCase() === "last month") {

      const user_count = await User.countDocuments({ 
        createdAt: { $gte: last_month_start, $lte: last_month_end }
      });

      const last_month_total_users = await User.countDocuments({
        createdAt: { 
          $gte: new Date(last_month_start.setHours(0o0, 0o0, 0o0)), 
          $lte: new Date(last_month_end.setHours(23, 59, 59))
        }
      });

      const this_month_total_users = await User.countDocuments({
        createdAt: { 
          $gte: new Date(this_month_start.setHours(0o0, 0o0, 0o0)), 
          $lte: new Date(this_month_end.setHours(23, 59, 59))
        }
      });

      const total_user_diff = this_month_total_users - last_month_total_users;
      const total_user_percentage_from_last_month = ((100 * total_user_diff)/last_month_total_users).toFixed(2);
     
      // active users
      const active_users = await User.countDocuments({ last_order_date: { $lt: new Date(new Date(last_month_end).getTime() - 90 * 24 * 60 *60 * 1000) }});

      const last_month_total_active_users = await User.countDocuments({
        last_order_date: { $gt: new Date(last_month_end.getTime() - 90 * 24 * 60 * 60 * 1000) }
      });

      const this_month_total_active_users = await User.countDocuments({
        last_order_date: {
          $gt: new Date(this_month_end.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });

      const active_user_diff = +this_month_total_active_users - +last_month_total_active_users
      const active_user_percentage_from_last_month = active_user_diff === 0 ? "0.00" : ((100 * active_user_diff)/last_month_total_active_users).toFixed(2);

      // inactive users
      const inactive_users = await User.countDocuments({ last_order_date: { $gte: new Date(new Date(last_month_end).getTime() - 90 * 24 * 60 *60 * 1000) }});

      const last_month_total_inactive_users = await User.countDocuments({
        last_order_date: { $lte: new Date(last_month_end.getTime() - 90 * 24 * 60 * 60 * 1000) }
      });

      const this_month_total_inactive_users = await User.countDocuments({
        last_order_date: {
          $lte: new Date(this_month_end.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });
      
      const inactive_user_diff = +this_month_total_inactive_users - +last_month_total_inactive_users
      const inactive_user_percentage_from_last_month = inactive_user_diff === 0 ? "0.00" : ((100 * inactive_user_diff)/last_month_total_inactive_users)
      const response = {
        total_customers: user_count,
        active_users,
        inactive_users,
        total_user_percentage_from_last_month: `${total_user_percentage_from_last_month}%`,
        active_user_percentage_from_last_month: `${active_user_percentage_from_last_month}%`,
        inactive_user_percentage_from_last_month: `${inactive_user_percentage_from_last_month}%`
      }
     
      return res.json(success("Success", response, res.statusCode));
    } else if (regex.test(date_filter.toString())) {
      const now = new Date(date_filter.toLocaleString());
      
      const start_date = new Date(now.setDate(1));
      const end_date = last_day_of_month(now);

      const right_now = new Date()
      const this_month = new Date(now.setMonth(right_now.getMonth()));
      const this_month_start = new Date(this_month.setDate(1));
      const this_month_end = last_day_of_month(this_month);

      const user_count = await User.countDocuments({ 
        createdAt: { $gte: start_date, $lte: end_date }
      });

      const last_month_total_users = await User.countDocuments({
        createdAt: { 
          $gte: new Date(last_month_start.setHours(0o0, 0o0, 0o0)), 
          $lte: new Date(last_month_end.setHours(23, 59, 59))
        }
      });

      const this_month_total_users = await User.countDocuments({
        createdAt: { 
          $gte: new Date(this_month_start.setHours(0o0, 0o0, 0o0)), 
          $lte: new Date(this_month_end.setHours(23, 59, 59))
        }
      });

      const total_user_diff = this_month_total_users - last_month_total_users;
      const total_user_percentage_from_last_month = ((100 * total_user_diff)/last_month_total_users).toFixed(2);
     
      // active users
      const active_users = await User.countDocuments({ last_order_date: { $lt: new Date(new Date().getTime() - 90 * 24 * 60 *60 * 1000) }});

      const last_month_total_active_users = await User.countDocuments({
        last_order_date: { $gt: new Date(last_month_end.getTime() - 90 * 24 * 60 * 60 * 1000) }
      });

      const this_month_total_active_users = await User.countDocuments({
        last_order_date: {
          $gt: new Date(this_month_end.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });

      const active_user_diff = +this_month_total_active_users - +last_month_total_active_users
      const active_user_percentage_from_last_month = active_user_diff === 0 ? "0.00" : ((100 * active_user_diff)/last_month_total_active_users).toFixed(2);

      // inactive users
      const inactive_users = await User.countDocuments({ last_order_date: { $gte: new Date(new Date().getTime() - 90 * 24 * 60 *60 * 1000) }});

      const last_month_total_inactive_users = await User.countDocuments({
        last_order_date: { $lte: new Date(last_month_end.getTime() - 90 * 24 * 60 * 60 * 1000) }
      });

      const this_month_total_inactive_users = await User.countDocuments({
        last_order_date: {
          $lte: new Date(this_month_end.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      });
      
      const inactive_user_diff = +this_month_total_inactive_users - +last_month_total_inactive_users
      const inactive_user_percentage_from_last_month = inactive_user_diff === 0 ? "0.00" : ((100 * inactive_user_diff)/last_month_total_inactive_users)
      const response = {
        total_customers: user_count,
        active_users,
        inactive_users,
        total_user_percentage_from_last_month: `${total_user_percentage_from_last_month}%`,
        active_user_percentage_from_last_month: `${active_user_percentage_from_last_month}%`,
        inactive_user_percentage_from_last_month: `${inactive_user_percentage_from_last_month}%`
      }
     
      return res.json(success("Success", response, res.statusCode));
    }
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const search_customers = async (req: Request, res: Response) => {
  try {
    const { limit, offset } = pagination(req.query);
    const { search_term } = req.query;
    const search_result = await User.paginate({
      $or: [
        {
          full_name: {
            $regex: search_term,
            $options: "i"
          }
        },
        {
          email: {
            $regex: search_term,
            $options: "i"
          }
        },
        {
          phone: {
            $regex: search_term,
            $options: "i"
          }
        },
        {
          "address.city": {
            $regex: search_term,
            $options: "i"
          }
        }
      ]
    }, {
      limit, offset
    });
    return res.json(success("Success", search_result, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const admin_dashboard_customer_details = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    const user = await User.findById(user_id).select("_id address createdAt email full_name phone");
    if (!user) return res.status(404).json(error("User not found", res.statusCode));
    const all_orders = await Order.find({ userId: user_id }).sort({ createdAt: -1 });
    const restaurant_order_count = all_orders.filter(order => order?.merchant_category?.toLowerCase() === "restaurants").length;
    const cake_order_count = all_orders.filter(order => order?.merchant_category?.toLowerCase() === "cakes").length;
    const grocery_order_count = all_orders.filter(order => order?.merchant_category?.toLowerCase() === "grocery").length;
    const food_bowls_order_count = all_orders.filter(order => order?.merchant_category?.toLowerCase() === "food bowls").length;
    const finger_foods_order_count = all_orders.filter(order => order?.merchant_category?.toLowerCase() === "finger foods").length;
    // Percentage calculation
    const restaurant_percentage = restaurant_order_count === 0 ? "0.00" : ((100 * restaurant_order_count)/all_orders.length).toFixed(2);
    const cake_percentage = cake_order_count === 0 ? "0.00" : ((100 * cake_order_count)/all_orders.length).toFixed(2);
    const grocery_percentage = grocery_order_count === 0 ? "0.00" : ((100 * grocery_order_count)/all_orders.length).toFixed(2);
    const food_bowl_percentage = food_bowls_order_count === 0 ? "0.00" : ((100 * food_bowls_order_count)/all_orders.length).toFixed(2);
    const finger_food_percentage = finger_foods_order_count === 0 ? "0.00" : ((100 * finger_foods_order_count)/all_orders.length).toFixed(2);
    const category_of_orders = {
      total_order_count: all_orders.length,
      restaurant_percentage: `${restaurant_percentage}%`,
      grocery_percentage: `${grocery_percentage}%`,
      cake_percentage: `${cake_percentage}%`,
      food_bowl_percentage: `${food_bowl_percentage}%`,
      finger_food_percentage: `${finger_food_percentage}%`
    }
    const chart_data = last_year_data(all_orders);
    const response_data = {
      user_details: user,
      category_of_orders,
      chart_data
    }

    return res.json(success("Success", response_data, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const dashboard_customer_recent_orders = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { user_id } = req.query;
    const all_orders = await Order.paginate({ userId: user_id }, { limit, offset, sort: { createdAt: -1 }, populate: ["restaurantId", "restaurantId.merchant_type"]});
    return res.json(success("Success", all_orders, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}

export const dashboard_customer_recent_transactions = async (req: Request, res: Response) => {
  try {
    const { offset, limit } = pagination(req.query);
    const { user_id } = req.query;
    const all_orders = await Order.paginate({ 
        userId: user_id 
      }, 
      { 
        limit, 
        offset, 
        sort: { createdAt: -1 },
        select: ["reference_code", "createdAt", "merchant_category", "restaurantId", "status"], 
        populate: ["restaurantId", "restaurantId.merchant_type"]
    });
    return res.json(success("Success", all_orders, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Contact support for assistance", res.statusCode));
  }
}


export const get_stripe_customer_details = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json(error("User does not exist", res.statusCode));
    const result = await fetch(`${process.env.STRIPE_BASE_URL}/v1/customers/${user.stripe_id}/payment_methods`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key.STRIPE_KEY}`
      }
    });
    const response = await result.json()
    return res.json(success("Success", response, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Some went wrong. Please try again or contact our support", res.statusCode));
  }
}