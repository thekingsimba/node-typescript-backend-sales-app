import { Router } from 'express';

import {
  add_note_to_cart,
  addToCart,
  cart_items,
  removeItemFromCart,
  updateItemQuantity,
} from './cart.controller';
import { add_to_cart_validation } from './cart.validation';

export const cartRoutes = Router();

cartRoutes.post("/add", add_to_cart_validation, addToCart);
cartRoutes.get("/items", cart_items);
cartRoutes.put("/increase_quantity", updateItemQuantity);
cartRoutes.delete("/remove_item", removeItemFromCart);
cartRoutes.post("/add/note", add_note_to_cart);
