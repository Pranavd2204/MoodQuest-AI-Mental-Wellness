import { api } from "@/lib/api";
import type { EmergencyResources } from "@/types";

export const emergencyService = {
  async getResources(): Promise<EmergencyResources> {
    const { data } = await api.get<EmergencyResources>("/api/emergency/resources");
    return data;
  },
};
