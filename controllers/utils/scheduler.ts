import job from 'node-cron';
import { Merchant } from '../controllers/merchant/merchant.schema';
import Logger from './logger';
import { day_of_the_week } from './util';

export const scheduler = () => {
  try {

    // Setting merchants' store status to open
    job.schedule("*/10 * * * *", async () => {
      let merchants = await Merchant.find({ status: "closed" });
      if (merchants && merchants.length > 0) {
        for (let merchant of merchants) {
          const days_of_operations = merchant && merchant.open_close_time;
          const now = new Date();
          const current_day = days_of_operations.find(day => day.day.toString().toLowerCase() === day_of_the_week().toString().toLowerCase());
          if (current_day && +current_day.opening_time.split(":")[0] == now.getHours() && +current_day.opening_time.split(":")[1] <= now.getMinutes() && current_day.status === "open") {
            merchant.status = "open";
            merchant.manually_closed = false;
            await merchant.save();
          }
        }
      }
    });

    // Setting merchants' store status to closed
    job.schedule("*/20 * * * * *", async () => {
      let merchants = await Merchant.find({ status: "open" });
      if (merchants && merchants.length > 0) {
        for (let merchant of merchants) {
          const days_of_operations = merchant && merchant.open_close_time;
          const now = new Date();
          const current_day = days_of_operations.find(day => day.day.toString().toLowerCase() === day_of_the_week().toString().toLowerCase());
          if (current_day && +current_day.closing_time.split(":")[0] == now.getHours() && +current_day.closing_time.split(":")[1] <= now.getMinutes() && current_day.status === "open") {
            merchant.status = "closed";
            await merchant.save();
          }
        }
      }
    });
  } catch (err:any) {
    Logger.error(err.message);
  }
}