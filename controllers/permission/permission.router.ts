import express from "express";
import { verifyUser } from "../../middleware/auth";
import { adminPermissionList, create, permissionList, permissionDetails, deletePermission, searchPermission } from "./permission.controller";

const router = express.Router();

router.post("/create", verifyUser, create);
router.get("/merchant/list", verifyUser, permissionList);
router.get("/admin/list", verifyUser, adminPermissionList);
router.get("/details", verifyUser, permissionDetails);
router.put("/update", verifyUser, adminPermissionList);
router.delete("/delete", verifyUser, deletePermission);
router.get("/search", verifyUser, searchPermission);

export { router as permissionRoutes }