
require("dotenv").config();
const fs = require("fs");
const encryptor = require("simple-encryptor")(process.env.IPADDRESS_LOGS);
const secretKey = process.env.S3_SECRET_KEY;
const accessKey = process.env.S3_ACCESS_KEY;
// const secKey = process.env.IPADDRESS_LOGS;

async function main() {
  try {
    console.log(secretKey)
    const encrypted_accessKey = encryptor.encrypt(accessKey);
    const encrypted_secretKey = encryptor.encrypt(secretKey);
    console.log(encrypted_accessKey)
    fs.writeFileSync(__dirname + "/src/encryptedAKey.txt", encrypted_accessKey);
    fs.writeFileSync(__dirname + "/src/encryptedSKey.txt", encrypted_secretKey)
  }catch(e) {
    console.log(e.message)
  }
}

main();