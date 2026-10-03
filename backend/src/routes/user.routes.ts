import { Router } from "express";

import * as users from "../controllers/user.controller.ts";
import { validate } from "../middleware/validate.ts";
import { changePasswordBody, contactBody, idParam, profileUpdateBody } from "../schemas/index.ts";

export const userRoutes = Router();
const contactId = idParam("contactId");

userRoutes.get("/profile", users.getProfile);
userRoutes.put("/profile", validate({ body: profileUpdateBody }), users.updateProfile);
userRoutes.put("/password", validate({ body: changePasswordBody }), users.changePassword);
userRoutes.get("/emergency-contacts", users.listContacts);
userRoutes.post("/emergency-contacts", validate({ body: contactBody }), users.createContact);
userRoutes.put("/emergency-contacts/:contactId", validate({ params: contactId, body: contactBody }), users.updateContact);
userRoutes.delete("/emergency-contacts/:contactId", validate({ params: contactId }), users.deleteContact);
