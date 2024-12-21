import mongoose from 'mongoose';
import path from 'path';

import key from './key';
import Logger from '../utils/logger';

require("dotenv").config({ path: path.resolve(__dirname + "/../../.env") });
const env = process.env.NODE_ENV || 'development';

export const db = () => {
  mongoose.Promise = global.Promise;
  // mongodb+srv://${key.DB_USER}:${key.DB_PASSWORD}@${key.DB_HOST}/${key.DATABASE}
  mongoose.connect(`mongodb+srv://${key.DB_USER}:${key.DB_PASSWORD}@${key.DB_HOST}/${key.DATABASE}`, (err) => {
    if (err) {
      Logger.error(err.message);
    } else {
      Logger.info(`Successfully Connected to MongoDB`);
    }
  });
}