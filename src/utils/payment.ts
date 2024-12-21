import key from "../config/key";
import { Request, Response } from "express";
import { error, success } from "../config/response";

const stripe = require("stripe")(key.STRIPE_KEY);

export const pay_with_stripe = async (amount: number, token: object, description: string) => {
  try {
    const charge = await stripe.charges.create({
      amount,
      currency: 'usd',
      source: token,
      description,
    });
    
    if (charge && charge.status === "succeeded") {
      return { data: charge }
    }
  } catch (err: any) {
    console.log(err.type, err)
    let message = err.message;
    if (err.type === 'StripeCardError') {
      message = err.message;
    }
    return { error: message}
  }
}
export const tokenization = async (req: Request, res: Response) => {
  try {
    const token = await stripe.tokens.create({
      card: {
        number: '0000000000000000',
        exp_month: 6,
        exp_year: 2024,
        cvc: '000',
      },
    });

    return res.json(success("Success", token, res.statusCode));
  } catch (err: any) {
    console.log(err.type)
    console.log(err.message)
    return res.status(500).json(error(err.message, res.statusCode));
  }
}