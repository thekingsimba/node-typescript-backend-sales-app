import { Router } from 'express';

import { verifyUser } from '../../middleware/auth';
import {
  create,
  deleteFood,
  getFoodByCategory,
  getFoodDetails,
  getList,
  publishedFoodList,
  publishFood,
  restaurantFoods,
  unpublishedFoodList,
  updateFood,
} from './food.controller';
import { createValidator, listValidator, merchantFoodValidator, publishValidator, queryValidator } from './food.validation';

export const foodRoutes = Router();

foodRoutes.post("/create", verifyUser, createValidator, create);
foodRoutes.put("/publish", publishValidator, publishFood);
foodRoutes.get("/published", listValidator, publishedFoodList);
foodRoutes.get("/unpublished", verifyUser, listValidator, unpublishedFoodList);
foodRoutes.get("/all", listValidator, getList);
foodRoutes.get("/details", getFoodDetails);
foodRoutes.get("/by_category", getFoodByCategory);
foodRoutes.get("/restaurant/food", merchantFoodValidator, restaurantFoods);
foodRoutes.put("/update", verifyUser, queryValidator, updateFood);
foodRoutes.delete("/delete", verifyUser, queryValidator, deleteFood);