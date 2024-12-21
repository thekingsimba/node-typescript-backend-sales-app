import { Request, Response } from 'express';
import { error, success } from '../../config/response';
import { paginated_data } from '../../middleware/pagination';
import Logger from '../../utils/logger';
import { Food } from './food.schema';
import { IFood, IPublish } from './interface';
import { isValidObjectId } from 'mongoose';

export const create = async (req: Request, res: Response) => {
  try {
    let foodData: IFood = req.body;
    let food = new Food({ 
      name: foodData.name,
      category: foodData.category, 
      description: foodData.description, 
      extras: foodData.extras,
      extrasCategory: foodData.extraCategory,
      image_url: foodData.image_url, 
      price: foodData.price, 
      restaurant: foodData.restaurant,
      estimatedPrepTime: foodData.estimatedPrepTime,
      taxRate: foodData.taxRate,
      unit: foodData.unit,
    });

    food = await food.save();
    return res.json(success("Success", food, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const publishFood = async (req: Request, res: Response) => {
  try {
    let publish: IPublish = req.body;
    let food = await Food.findOneAndUpdate({ restaurant: publish.restaurantID, _id: publish.foodID }, { $set: { published: publish.published }}, { new: true});
    
    if (!food) return res.status(404).json(error("Item does not exist", res.statusCode));
    return res.json(success("Food published!!", food, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const publishedFoodList = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const publishedFoods = await Food.find({ published: true }).populate("category").populate("restaurant", "first_name last_name restaurant_name email phone_number discount_amount address");
    if (publishedFoods.length === 0) return res.status(404).json(error("No records found", res.statusCode));
    const result = paginated_data(publishedFoods, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const unpublishedFoodList = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const unpublishedFoods = await Food.find({ published: false }).populate("category").populate("restaurant", "first_name last_name restaurant_name email phone_number discount_amount address");
    const result = paginated_data(unpublishedFoods, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const getList = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const food = await Food.find({}).populate("category").populate("restaurant", "first_name last_name restaurant_name email phone_number discount_amount address").populate("extras");
    const result = paginated_data(food, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const restaurantFoods = async (req: Request, res: Response) => {
  try {
    const { restaurant, page, limit } = req.query;
    const food = await Food.find({ restaurant }).populate("category").populate("restaurant", "first_name last_name restaurant_name email phone_number discount_amount address").populate("extras");
    const result = paginated_data(food, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const updateFood = async (req: Request, res: Response) => {
  try {
    const food = await Food.findByIdAndUpdate({ _id: req.query.id }, req.body, { new: true });
    if (!food) return res.status(404).json(error("Food does not exist", res.statusCode));
    return res.json(success("Success", food, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const deleteFood = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    const food = await Food.findByIdAndDelete({ _id: id });
    if (!food) return res.status(404).json(error("Food does not exist", res.statusCode));
    return res.json(success("Success", food, res.statusCode));
  } catch (err: any) {
    return res.status(500).json(error(err.message, res.statusCode));
  }
}

export const getFoodByCategory = async (req: Request, res: Response) => {
  try {
    const { page, limit, category, restaurant } = req.query;
    if (!category || !isValidObjectId(category)) return res.status(400).json(error("Invalid category ID", res.statusCode));
    if (!restaurant || !isValidObjectId(restaurant)) return res.status(400).json(error("Invalid restaurant ID", res.statusCode));
    let food; 
    food = await Food.find({ category, restaurant }).populate("category").populate("restaurant", "first_name last_name email phone_number address").populate("extras").sort({ createdAt: "descending"});
    const result = paginated_data(food, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error(err.message, res.statusCode));
  }
}
      
export const getFoodDetails = async (req: Request, res: Response) => {
  try {
    const food = await Food.findById(req.query.id).populate("extrasCategory").populate("category").populate("extras");
    if (!food) return res.status(404).json(error("No records found for your request", res.statusCode));
    return res.json(success("Success", food, res.statusCode));
  } catch (err: any) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error(err.message, res.statusCode));
  }
}    
