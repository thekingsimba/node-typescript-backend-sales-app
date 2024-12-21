import key from "../config/key";
import { NextFunction, Request, Response } from "express";
import moment from "moment";
import { GoogleAuth} from "google-auth-library";
import Stripe from "stripe";
import { fetch } from "./fetch";

const stripe = new Stripe(key.STRIPE_KEY, { "apiVersion": "2022-11-15" });

export const computed_time = async (time: any) => {
  const currentTime = moment(new Date(), "HH:mm:ss").format("HH:m");
  const data = moment(new Date(), "HH:mm:ss").add(time, 'minutes').format("HH:m");
  // const currentTime24 = moment(new Date(), "HH:mm:ss").format("HH:mm");
  // const data24 = moment(new Date(), "HH:mm:ss").add(time, 'minutes').format("HH:m");
  const split_current = currentTime.split(":");
  const split_future = data.split(":");
  const current_hour = split_current[0];
  const current_min = split_current[1];
  const future_hour = split_future[0];
  const future_min = split_future[1];
  const formatted_current_hour = current_hour.length < 2 ? `0${current_hour}` : current_hour;
  const formatted_future_hour = future_hour.length < 2 ? `0${future_hour}` : future_hour;

  const formatted_current_min = current_min.length < 2 ? `0${current_min}` : current_min;
  const formatted_future_min = future_min.length < 2 ? `0${future_min}` : future_min;
  // const pm_future = +future_hour > 11 ? " PM" : " AM";
  // const current_time = `${currentTime.split(":")[0]}:${current_min}${pm_current}`;
  // const future_time = `${data.split(":")[0]}:${future_min}${pm_future}`;
  // console.log(currentTime, data);
  const estimated_time = `${formatted_current_hour}:${formatted_current_min} - ${formatted_future_hour}:${formatted_future_min}`
  return estimated_time;
}

export const last_day_of_month = (month: any) => {
  const last_date = month.getMonth() === 2 ?
  new Date(month.setDate(28)) : month.getMonth() === 4 ?
  new Date(month.setDate(30)) : month.getMonth() === 6 ?
  new Date(month.setDate(30)) : month.getMonth() === 9 ?
  new Date(month.setDate(30)) : month.getMonth() === 11 ?
  new Date(month.setDate(30)) : new Date(month.setDate(31));

  return last_date;
}

export const customer_stripe_details = async (id: string) => {
  try {
    const customer = await stripe.customers.retrieve(id);
    return { data: customer }
  } catch (err: any) {
    return { error: err.message }
  }
}

export const day_of_the_week = () => {

  let days_of_the_week: any = { 0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" };
  const day_of_week = moment(new Date()).day();
  const today = days_of_the_week[day_of_week];
  return today;
}

export const month_and_date = () => {
  const months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
  const now = new Date()
  const currentMonth = now.getMonth();
  const today = now.getDate();
  const monthName = months[currentMonth]
  return { month: monthName, date: today };
}


// Function to calculate distance between two coordinates using Haversine formula
export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export const toRad = (degrees: any) => {
  return degrees * (Math.PI / 180);
}

// Define the geofence parameters
const geofence = {
  center: { lat: 50.3755, lng: -4.1427 }, // Coordinates of Plymouth
  radius: 10 // Radius in kilometers
};

// Function to check if a point is within the geofence
export const isWithinGeofence = (point: any) => {
  const distance = haversineDistance(
      geofence.center.lat, geofence.center.lng,
      point.lat, point.lng
  );
  return distance <= geofence.radius;

  // Example usage
  // const testPoint = { lat: 50.3700, lng: -4.1400 }; // Test coordinates

  // if (isWithinGeofence(testPoint)) {
  //   console.log('The point is within the geofence.');
  // } else {
  //   console.log('The point is outside the geofence.');
  // }
}




export const rateLimiter = (options: any) => {
  const { windowMs, maxRequests } = options;
  const requestCounts = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!requestCounts.has(clientIp)) {
      requestCounts.set(clientIp, []);
    }

    const timestamps = requestCounts.get(clientIp).filter((timestamp: any) => timestamp > windowStart);
    timestamps.push(now);
    requestCounts.set(clientIp, timestamps);
    if (timestamps.length > maxRequests) {
      res.status(429).send('Too Many Requests, please try again later.');
    } else {
      next();
    }
  };
};