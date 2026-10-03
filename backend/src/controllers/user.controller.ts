import type { Request, Response } from "express";
import type { z } from "zod";

import { currentUser } from "../middleware/auth.ts";
import { body, params } from "../middleware/validate.ts";
import type { changePasswordBody, contactBody, profileUpdateBody } from "../schemas/index.ts";
import { changePassword as changeUserPassword } from "../services/auth.service.ts";
import * as userService from "../services/user.service.ts";

type ContactId = { contactId: number };

export async function getProfile(req: Request, res: Response) {
  res.json(await userService.getProfile(currentUser(req)));
}

export async function updateProfile(req: Request, res: Response) {
  res.json(await userService.updateProfile(currentUser(req), body<z.infer<typeof profileUpdateBody>>(req)));
}

export async function changePassword(req: Request, res: Response) {
  const input = body<z.infer<typeof changePasswordBody>>(req);
  await changeUserPassword(currentUser(req), input.current_password, input.new_password);
  res.json({ message: "Password updated" });
}

export async function listContacts(req: Request, res: Response) {
  res.json(await userService.listContacts(currentUser(req).id));
}

export async function createContact(req: Request, res: Response) {
  res.status(201).json(await userService.createContact(currentUser(req).id, body<z.infer<typeof contactBody>>(req)));
}

export async function updateContact(req: Request, res: Response) {
  const { contactId } = params<ContactId>(req);
  res.json(await userService.updateContact(currentUser(req).id, contactId, body<z.infer<typeof contactBody>>(req)));
}

export async function deleteContact(req: Request, res: Response) {
  await userService.deleteContact(currentUser(req).id, params<ContactId>(req).contactId);
  res.status(204).end();
}
