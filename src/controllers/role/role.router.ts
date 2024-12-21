import { Router } from "express";
import { verifyUser } from "../../middleware/auth";
import { addPermissions, create, deleteRole, getRole, getRoles, updateRole } from "./role.controller";
import { add_permission_validator, create_validator, detail_validator, list_validator, update_validator } from "./role.validation";

export const roleRouter = Router();

roleRouter.post("/create", verifyUser, create_validator, create);
roleRouter.get("/all", verifyUser, list_validator, getRoles);
roleRouter.get("/details", verifyUser, detail_validator, getRole);
roleRouter.put("/update", verifyUser, update_validator, updateRole);
roleRouter.delete("/delete", verifyUser, detail_validator, deleteRole);
roleRouter.put("/add/permission", verifyUser, add_permission_validator, addPermissions);