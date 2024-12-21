import { Router } from "express";
import { createAddress, deliveryAddressList } from "./address.controller";

const router = Router();

router.post("/create", createAddress);
router.get("/list", deliveryAddressList);

export { router as deliveryAddressRoute };