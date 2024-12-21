
import fs from "fs";
import  aws from 'aws-sdk';
import shortid from "shortid";
import  multer from 'multer';
import  multerS3 from 'multer-s3';
import key from "../config/key";

const accessKey = key.S3_ACCESS_KEY;
const secretKey = key.S3_SECRET_KEY;
const  s3: object = new aws.S3({
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
});

const maxSize = 100 * 1024 * 1024;
 
export const upload = multer({
  storage: multerS3({
    s3:<any> s3,
    bucket: key.S3_BUCKET_NAME,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, shortid.generate() + "-" + file.originalname);
    }
  }),
  limits: { fileSize: maxSize }
});