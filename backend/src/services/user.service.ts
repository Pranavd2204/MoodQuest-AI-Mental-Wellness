import { prisma } from "../lib/prisma.ts";
import type { AuthUser } from "../middleware/auth.ts";
import { badRequest, notFound } from "../utils/httpError.ts";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  serializeContact,
  serializeProfile,
  type NotificationPreferences,
} from "../utils/serializers.ts";

export const MAX_EMERGENCY_CONTACTS = 5;

async function ensureProfile(user: AuthUser) {
  return (
    user.profile ??
    (await prisma.profile.create({
      data: { userId: user.id, notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES },
    }))
  );
}

export async function getProfile(user: AuthUser) {
  return serializeProfile(user, await ensureProfile(user));
}

export interface ProfileUpdate {
  name?: string;
  avatar_url?: string;
  remove_avatar?: boolean;
  preferred_language?: string;
  timezone?: string;
  notification_preferences?: NotificationPreferences;
}

export async function updateProfile(user: AuthUser, update: ProfileUpdate) {
  await ensureProfile(user);
  const avatarUrl = update.remove_avatar ? null : update.avatar_url;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(update.name !== undefined && { name: update.name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      profile: {
        update: {
          ...(update.preferred_language !== undefined && { preferredLanguage: update.preferred_language }),
          ...(update.timezone !== undefined && { timezone: update.timezone }),
          ...(update.notification_preferences !== undefined && {
            notificationPreferences: update.notification_preferences,
          }),
        },
      },
    },
    include: { profile: true },
  });
  return serializeProfile(updated, updated.profile!);
}


export interface ContactInput {
  name: string;
  phone: string;
  relationship?: string | null;
  is_primary: boolean;
}

async function ownedContact(userId: number, id: number) {
  const contact = await prisma.emergencyContact.findFirst({ where: { id, userId } });
  if (!contact) throw notFound("Contact not found");
  return contact;
}

export async function listContacts(userId: number) {
  const contacts = await prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
  });
  return contacts.map(serializeContact);
}

export async function createContact(userId: number, input: ContactInput) {
  const existing = await prisma.emergencyContact.count({ where: { userId } });
  if (existing >= MAX_EMERGENCY_CONTACTS) throw badRequest(`You can save up to ${MAX_EMERGENCY_CONTACTS} contacts`);
  const isPrimary = input.is_primary || existing === 0;
  const contact = await prisma.$transaction(async (tx) => {
    if (isPrimary) await tx.emergencyContact.updateMany({ where: { userId }, data: { isPrimary: false } });
    return tx.emergencyContact.create({
      data: { userId, name: input.name, phone: input.phone, relationship: input.relationship ?? null, isPrimary },
    });
  });
  return serializeContact(contact);
}

export async function updateContact(userId: number, id: number, input: ContactInput) {
  const contact = await ownedContact(userId, id);
  const updated = await prisma.$transaction(async (tx) => {
    if (input.is_primary && !contact.isPrimary) {
      await tx.emergencyContact.updateMany({ where: { userId }, data: { isPrimary: false } });
    }
    return tx.emergencyContact.update({
      where: { id },
      data: { name: input.name, phone: input.phone, relationship: input.relationship ?? null, isPrimary: input.is_primary },
    });
  });
  return serializeContact(updated);
}

export async function deleteContact(userId: number, id: number) {
  const contact = await ownedContact(userId, id);
  await prisma.$transaction(async (tx) => {
    await tx.emergencyContact.delete({ where: { id } });
    if (contact.isPrimary) {
      const replacement = await tx.emergencyContact.findFirst({ where: { userId }, orderBy: { id: "asc" } });
      if (replacement) await tx.emergencyContact.update({ where: { id: replacement.id }, data: { isPrimary: true } });
    }
  });
}
