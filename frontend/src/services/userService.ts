import { api } from "@/lib/api";
import type { EmergencyContact, EmergencyContactInput, Profile, ProfileUpdate } from "@/types";

export const userService = {
  async getProfile(): Promise<Profile> {
    const { data } = await api.get<Profile>("/api/users/profile");
    return data;
  },
  async updateProfile(update: ProfileUpdate): Promise<Profile> {
    const { data } = await api.put<Profile>("/api/users/profile", update);
    return data;
  },
  async changePassword(current_password: string, new_password: string): Promise<void> {
    await api.put("/api/users/password", { current_password, new_password });
  },
  async listContacts(): Promise<EmergencyContact[]> {
    const { data } = await api.get<EmergencyContact[]>("/api/users/emergency-contacts");
    return data;
  },
  async createContact(contact: EmergencyContactInput): Promise<EmergencyContact> {
    const { data } = await api.post<EmergencyContact>("/api/users/emergency-contacts", contact);
    return data;
  },
  async updateContact(id: number, contact: EmergencyContactInput): Promise<EmergencyContact> {
    const { data } = await api.put<EmergencyContact>(`/api/users/emergency-contacts/${id}`, contact);
    return data;
  },
  async deleteContact(id: number): Promise<void> {
    await api.delete(`/api/users/emergency-contacts/${id}`);
  },
};
