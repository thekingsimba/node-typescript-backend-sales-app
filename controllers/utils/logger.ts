import key from '../config/key';
import { addColors, format, createLogger, transports } from 'winston';
import "winston-mongodb";
const { combine, colorize, timestamp, printf } = format

// Define your severity levels. 
// With them, You can create log files, 
// see or hide levels based on the running ENV.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// This method set the current severity based on 
// the current NODE_ENV: show all the log levels 
// if the server was run in development mode; otherwise, 
// if it was run in production, show only warn and error messages.
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

// Define different colors for each level. 
// Colors make the log message more visible,
// adding the ability to focus or ignore messages.
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// Tell winston that you want to link the colors 
// defined above to the severity levels.
addColors(colors)

// Chose the aspect of your log customizing the log format.


// Define which transports the logger must use to print out messages. 
// In this example, we are using three different transports 


// Create the logger instance that has to be exported 
// and used to log messages.
const Logger = createLogger({
  level: level(),
  levels,
  format: combine(
    // Add the message timestamp with the preferred format
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // Tell Winston that the logs must be colored
    colorize({ all: true }),
    // Define the format of the message showing the timestamp, the level and the message
    printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  ),
  transports: [
    // Allow the use the console to print the messages
    new transports.Console(),
    // Allow to print all the error level messages inside the error.log file
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Allow to print all the error message inside the all.log file
    // (also the error log that are also printed inside the error.log(
    new transports.File({ filename: 'logs/combine.log' }),
    // Save the logs to MongoDB database
    new transports.MongoDB({
      db: `mongodb+srv://${key.DB_USER}:${key.DB_PASSWORD}@${key.DB_HOST}/${key.DATABASE}`
    })
  ],
})

if (process.env.NODE_ENV === "development") {
  Logger.add(new transports.Console({ format: format.json()}))
}

export default Logger