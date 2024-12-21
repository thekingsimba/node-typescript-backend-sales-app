import error from '../config/error';
import { deliveryAddressRoute } from './address/address.router';
import { authRouter } from './authhelper/auth.router';
import { cartRoutes } from './cart/cart.router';
import { DiscountRouter } from './discountPromotion/discount.router';
import { fileRouter } from './fileHandler/file.router';
import { foodRoutes } from './foods/food.router';
import { merchantRoutes } from './merchant/merchant.router';
import { notificationRoutes } from './notification/notification.router';
import { orderRouter } from './order/order.router';
import { roleRouter } from './role/role.router';
import { userRouter } from './users/users.router';

export default function (app: any): any {
  app.use("/api/auth", authRouter);
  app.use("/api/merchant", merchantRoutes);
  app.use("/api/files", fileRouter);
  app.use("/api/food", foodRoutes);
  app.use("/api/order", orderRouter);
  app.use("/api/cart", cartRoutes);
  app.use("/api/users", userRouter);
  app.use("/api/role", roleRouter);
  app.use("/api/notification", notificationRoutes);
  app.use("/api/address", deliveryAddressRoute);
  app.use("/api/discount", DiscountRouter);
  app.use(error);
}