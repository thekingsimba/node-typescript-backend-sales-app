import admin from "firebase-admin";
const ServiceAccount = require("./firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(ServiceAccount)
});

export { admin };