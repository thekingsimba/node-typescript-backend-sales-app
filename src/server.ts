import { createServer } from "http";
import express, { Application, NextFunction, Request, Response } from "express";
import { Server } from 'socket.io';
import basicAuth from "express-basic-auth";
import morganMiddleware from "./config/morganMiddleware";
import Logger from "./utils/logger";
import { db } from "./config/db";
import swaggerUi from "swagger-ui-express";
import router from "./controllers/index"
import "passport";
import YAML from "yamljs";
import { scheduler } from "./utils/scheduler";
import { Order } from "./controllers/order/order.schema";
import { Notification } from "./controllers/notification/notification.schema";
import { Merchant } from "./controllers/merchant/merchant.schema";
import { socket_notification_list } from "./controllers/notification/notification.controller";
import { socketRestaurantOrderList, socket_merchant_dashboard_overview } from "./controllers/order/order.controller";
// import { rateLimiter } from "./utils/util";
require('events').EventEmitter.defaultMaxListeners = 1000;

const swaggerJSDoc = YAML.load("./api.yml");
const app: Application = express();

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const port: number = 8000;
let client;

const limiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200 // Max requests per window
};

function job_runner() {
  try {
    db();
    scheduler();
  } catch (err: any) {
    Logger.error(err.message);
  }
}
app.set("socket", io)
app.set("redis", client);
// app.use(rateLimiter(limiterOptions));
app.use(morganMiddleware);
app.use( ( req, res, next ) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header({ "Access-Control-Allow-Credentials": true });
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Authorization, Content-Type, Accept, X-Auth-Token');
  next();
} );
app.get("/health", (req: Request, res: Response) => {
  res.send("Status Ok!!!!!!");
});
app.use("/api_docs", basicAuth({ users: { "YOUR_API_DOC_USER": "YOUR_API_DOC_PASSWORD"}, challenge: true }), swaggerUi.serve, swaggerUi.setup(swaggerJSDoc));

router(app);
io.on("connection", (socket) => {
  socket.on("order-update", async (data) => {
    if (!data) socket.emit("on-error", { message: "Order ID is required"})
    const order = await Order.findById(data.id).select({ status: 1, status_time_tracker: 1 });
    if (order) {
      socket.emit("order-details", order)
    } else {
      socket.emit("order-details", { message: "Order not found"})
    }
  });
  socket.on("notification-request", async (data) => {
    const notifications = await Notification.find({ "receiver.user_id": data.id, status: "new" });
    if (notifications && notifications.length > 0)
      socket.emit("notification-list", notifications);
    else socket.emit("notification-error", { message: "Notification records is empty" });
  });

  socket.on("notifications", async (payload) => {
    const { data, error } = await socket_notification_list(payload);
    if (data && data.length > 0)
      socket.emit("merchant-notifications", data);
    else socket.emit("error", { message: "Notification record is empty" });
    if (error) socket.emit("error", { message: error });
  });

  socket.on("merchant-orders", async (payload) => {
    const { data, error } = await socketRestaurantOrderList(payload);
    if (data && data.length > 0)
      socket.emit("order-list", data);
    else socket.emit("error", { message: "Order record is empty" });
    if (error) socket.emit("error", { message: error });
  });
  socket.on("get-overview", async (payload) => {
    const { data, error } = await socket_merchant_dashboard_overview(payload);
    if (data)
      socket.emit("order-overview", data);
    else socket.emit("error", { message: "Request failed." });
    if (error) socket.emit("error", { message: error });
  });

  socket.on("store-status", async (data) => {
    if (!data) socket.emit("on-error", { message: "Store ID is required" });
    const store = await Merchant.findById(data.id);
    socket.emit("store-details", store);
  });

  socket.on("disconnect", async() => {
    socket.disconnect(true)
  });
});

httpServer.listen(port, () => {
  job_runner();
  Logger.log("info", `Server is up and running at port ${port}`);
  
});

export default app;