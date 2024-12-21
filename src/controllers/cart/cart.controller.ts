import { Request, Response } from 'express';

import { error, success } from '../../config/response';
import { Food } from '../../controllers/foods/food.schema';
import { Merchant } from '../../controllers/merchant/merchant.schema';
import Logger from '../../utils/logger';
import { ICartData } from './cart.interface';
import { Cart } from './cart.schema';

export const addToCart = async (req: Request, res: Response) => {
  try {
    const data: ICartData = req.body;
    const { cart_id } = req.body;
    let items = [];
    let totalCost;
    const merchant = await Merchant.findById({ _id: data.merchant_id });
    if (!merchant) return res.status(400).json(error("Merchant does not exist", res.statusCode));
    const food = await Food.findById({ _id: data.food_id });

      
      const price = food && food.price;
      totalCost = price && price * +data.quantity;
      const item = {
        name: food.name,
        foodPrice: price && price,
        extras: data.extras,
        image: food.image_url,
        description: food.description,
        restaurantId: food.restaurant,
        foodId: data.food_id,
        totalPrice: totalCost,
        quantity: data.quantity,
        weight: 0
      }
      items.push(item);
  
      const merchant_data = {
        stripe_id: merchant.stripe_account_id,
        merchant_id: merchant._id,
        location: { type: merchant.location.type, coordinates: merchant.location.coordinates },
        first_name: merchant.first_name,
        last_name: merchant.last_name,
        email: merchant.email,
        phone_number: merchant.phone_number,
        restaurant_name: merchant.restaurant_name,
        address: {
          line_1: merchant.address.line_1,
          line_2: merchant.address.line_2,
          post_code: merchant.address.post_code,
          country: merchant.address.country
        },
        items,
        merchantTotal: Number(totalCost.toFixed(2)),
      }

      if (cart_id) {
        let cart = await Cart.findById({ _id: cart_id });
        if (cart) {
          let spreadMerchants = [...cart.merchants];
          let merchantIndex = spreadMerchants.findIndex(m => m.merchant_id.toString() === data.merchant_id.toString());
          
          if (merchantIndex >= 0) {
            const items = spreadMerchants && spreadMerchants[merchantIndex] && spreadMerchants[merchantIndex].items;
            let merchant_items_spread;
            if (items && Array.isArray(items)) {
              merchant_items_spread = [ ...items ];
            } else return res.status(400).json(error("Items is not an array", res.statusCode));
            let foodIndx = merchant_items_spread.findIndex(f => f.foodId.toString() === data.food_id.toString());
            if (foodIndx >= 0 && JSON.stringify(merchant_items_spread[foodIndx].extras) === JSON.stringify(data.extras)) return res.status(400).json(error("Item already in cart. Kindly increase the quantity", res.statusCode));
            spreadMerchants[merchantIndex].items.push(item);
            spreadMerchants[merchantIndex].merchantTotal = +((spreadMerchants[merchantIndex].merchantTotal + totalCost).toFixed(2));
            const existingCost = cart && cart.totalCost;
            cart.totalCost = Number((existingCost + totalCost).toFixed(2));
            cart = await cart.save();
            cart = await Cart.findById({ _id: cart._id }).populate([ "merchants.items.extras" ]);
            const cart_merchants = cart && cart.merchants;
            let m_items = [];
            for (let m of cart_merchants) {
              m_items.push(m.items);
            }
            const flat_list = m_items.flat();
            cart.totalItems = flat_list.length;
            cart = await cart.save();
            return res.json(success("Success", cart, res.statusCode));
          } else if (cart.merchants.length === 0) {
            cart.merchants.push(merchant_data);
            cart.totalCost = Number(totalCost.toFixed(2));
            cart = await cart.save();
            cart = await Cart.findById({ _id: cart._id });
            const cart_merchants = cart && cart.merchants;
            let m_items = [];
            for (let m of cart_merchants) {
              m_items.push(m.items);
            }
            const flat_list = m_items.flat();
            cart.totalItems = flat_list.length;
            cart = await cart.save();
            return res.json(success("Success", cart, res.statusCode));
          }
          return res.status(400).json(error("You can only buy from one store at a time", res.statusCode));
        } else {
          return res.status(400).json(error("Cart does not exists", res.statusCode));
        }
        
      } else {
        let newCart = new Cart();
        newCart.merchants.push(merchant_data);
        newCart.totalCost = Number(totalCost.toFixed(2));
        newCart = await newCart.save();
        newCart = await Cart.findById({ _id: newCart._id }).populate([ "merchants.items.extras" ]);
        const cart_merchants = newCart && newCart.merchants;
        let m_items = [];
        for (let m of cart_merchants) {
          m_items.push(m.items);
        }
        const flat_list = m_items.flat();
        newCart.totalItems = flat_list.length;
        newCart = await newCart.save();
        return res.json(success("Success", newCart, res.statusCode));
      }
    
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const updateItemQuantity = async (req: Request, res: Response) => {
  try {
    const { merchant_id, item_id, quantity, cart_id } = req.body;
    let cart = await Cart.findById({ _id: cart_id });
    if (!cart) return res.status(400).json(error("Cart does not exist", res.statusCode));
    let spreadItems = [ ...cart.merchants ];
    let itemIndx = spreadItems.findIndex(i => i.merchant_id.toString() === merchant_id.toString());
    if (itemIndx >= 0) {
      let item_spread = [...spreadItems[itemIndx].items ];
      const item_index = item_spread.findIndex(i => i._id.toString() === item_id.toString());
      if (item_index >= 0) {
        const initial_food_cost = item_spread[item_index].quantity * item_spread[item_index].foodPrice;
        spreadItems[itemIndx].merchantTotal = +((spreadItems[itemIndx].merchantTotal - initial_food_cost).toFixed(2));
        cart.totalCost = +((cart.totalCost - initial_food_cost).toFixed(2))
        console.log(item_spread[item_index], " the item")
        item_spread[item_index].quantity = +quantity;
        spreadItems[itemIndx].items = item_spread;
        spreadItems[itemIndx].merchantTotal += Number((item_spread[item_index].quantity * item_spread[item_index].foodPrice).toFixed(2));
        cart.merchants = spreadItems;
        cart.totalCost += Number((item_spread[item_index].quantity * item_spread[item_index].foodPrice).toFixed(2));
        cart = await cart.save();
      }
      cart = await Cart.findById({ _id: cart._id }).populate([ "merchants.items.extras" ]);
      const cart_merchants = cart && cart.merchants;
      let m_items = [];
      for (let m of cart_merchants) {
        m_items.push(m.items);
      }
      const flat_list = m_items.flat();
      cart.totalItems = flat_list.length;
      cart = await cart.save();
      return res.json(success("Success", cart, res.statusCode));
    } else {
      return res.status(400).json(error(`We could not find the item with ID ${item_id}`, res.statusCode));
    } 
  } catch (err: any) {
    return res.status(500).json(error("Something went wrong. Please try again after some times", res.statusCode));
  }
}

export const removeItemFromCart = async (req: Request, res: Response) => {
  try {
    const { cart_id, food_id, merchant_id } = req.query;
    if (!cart_id) return res.status(400).json(error("Query parameter: cart_id is required", res.statusCode));
    if (!food_id) return res.status(400).json(error("Query parameter: food_id is required", res.statusCode));
    if (!merchant_id) return res.status(400).json(error("Query parameter: merchant_id is required", res.statusCode));
    let cart = await Cart.findById({ _id: cart_id })
    if (!cart) return res.status(400).json(error("Cart does not exist", res.statusCode));
    let merchant_spread = [...cart.merchants];
    let merchant_index = merchant_spread.findIndex(m => m.merchant_id.toString() === merchant_id.toString());
    
    if (merchant_index >= 0) {
      const food = merchant_spread[merchant_index].items.filter(f => f.foodId.toString() === food_id.toString());
      const food_price = food && food[0] && food[0].foodPrice;
      const food_quantity = food && food[0] && food[0].quantity;
      const deduction_sum = (food_price * food_quantity);
      merchant_spread[merchant_index].merchantTotal = +((merchant_spread[merchant_index].merchantTotal - deduction_sum).toFixed(2));
      cart.totalCost = +((cart.totalCost - deduction_sum).toFixed(2));
      const filtered_items = merchant_spread[merchant_index].items.filter(f => f.foodId.toString() !== food_id.toString());
      merchant_spread[merchant_index].items = filtered_items;
      if (merchant_spread[merchant_index].items.length === 0) merchant_spread.splice(merchant_index,1);
      cart.merchants = merchant_spread;
      cart = await cart.save();
    }
    
    cart = await Cart.findById({ _id: cart._id }).populate([ "merchants.items.extras" ]);
    const cart_merchants = cart && cart.merchants;
    let m_items = [];
    for (let m of cart_merchants) {
      m_items.push(m.items);
    }
    const flat_list = m_items.flat();
    cart.totalItems = flat_list.length;
    cart = await cart.save();
    return res.json(success("Success", cart, res.statusCode));
  } catch (err: any) {
    console.log(err, " the error")
    return res.status(500).json(error("Something went wrong. Please try again after some times", res.statusCode));
  }
}

export const cart_items = async (req: Request, res: Response) => {
  try {
    const { cart_id } = req.query;
    const cart = await Cart.findById({ _id: cart_id }).populate(["merchants.items.extras"]);
    return res.json(success("Success", cart, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const add_note_to_cart = async (req: Request, res: Response) => {
  try {
    const { cart_id, note } = req.body;
    const cart = await Cart.findByIdAndUpdate(cart_id, { $set: { note }}, { new: true });
    if (!cart) return res.status(404).json(error("Cart does not exist", res.statusCode));
    return res.json(success("Note added successfully", cart, res.statusCode));
  } catch (err: any) {
    Logger.error(`Add note to CART ERROR LOG: ${JSON.stringify(err)}`);
    return res.status(500).json(error("Some thing went wrong.", res.statusCode));
  }
}