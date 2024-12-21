import { Document, Schema } from "mongoose";

export interface IMerchant extends Document {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  password: string
  bank_details: {
    sort_code: string;
    account_number: string;
    account_name: string;
    bank_name: string;
  }
  banner_image: string;
  slug: string;
  fhr_image: {
    image: string;
    last_updatedAt: Date;
  }
  restaurant_name: string
  discount_amount: number
  food_category: Schema.Types.ObjectId[]
  image_url: string;
  merchant_type: Schema.Types.ObjectId;
  permission: string[];
  address: {
    line_1: string
    line_2: string
    post_code: string
    country: string
  }
  location: {
    type: string,
    coordinates: object
  }
  ratings: [{ 
    userId: Schema.Types.ObjectId;
    rate: number;
    foodId: Schema.Types.ObjectId;
    review: string
  }];
  open_close_time?: {
    day: string;
    opening_time: string;
    closing_time: string;
    status: string;
  }[];
  averageRating: number;
  totalRating: number;
  customer_note: string;
  about: string;
  special_offer: {
    amount: number
    has_offer: boolean
  },
  status: string;
  verification_status: string;
  last_status_update_at: Date;
  role: {
    role_id: Schema.Types.ObjectId;
    role_name: string;
  };
  verification_code: string;
  otp_expires: Date;
  phone_verified: boolean;
  live_order_notification: boolean;
  promotion_notification: boolean;
  device_token: string[];
  manually_closed: boolean;
  stripe_account_id: string;
  connect_account_status: string;
  fsa_inspection_certificate: string;
  fsa_fhr_image: string;
  fsa_current_rating_written: number;
  fsa_last_updated_date: Date;
  fsa_awaiting_inspection_doc: string;
  fsa_scheduled_inspection_date: Date;
  store_link: string;
}

export interface IMerchantData {
  first_name: IMerchant["first_name"];
  last_name: IMerchant["last_name"];
  email: IMerchant["email"];
  phone_number: IMerchant["phone_number"];
  password: IMerchant["password"];
  restaurant_name: IMerchant["restaurant_name"];
  line_1: IMerchant["address"]["line_1"];
  line_2: IMerchant["address"]["line_2"];
  post_code: IMerchant["address"]["post_code"];
  country: IMerchant["address"]["country"];
  latitude: number;
  longitude: number;
  merchant_type: IMerchant["merchant_type"];
}

export interface IRating {
  userId: Schema.Types.ObjectId
  rate: number
  merchantId: Schema.Types.ObjectId
  review?: string
}

export interface Ibanner {
  banner_image: string;
  merchant_id: string;
}