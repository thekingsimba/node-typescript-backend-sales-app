import { Router } from "express";
import { verifyUser } from "../../middleware/auth";
import { createDiscount, delete_coupon, getDiscount, getDiscounts, update_coupon } from "./discount.controller";

const router = Router();

router.post("/create", verifyUser, createDiscount);
router.get("/list", verifyUser, getDiscounts);
router.get("/details", verifyUser, getDiscount);
router.put("/update", verifyUser, update_coupon);
router.delete("/delete", verifyUser, delete_coupon);

export { router as DiscountRouter };