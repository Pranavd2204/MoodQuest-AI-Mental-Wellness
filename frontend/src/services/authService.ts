import { api } from "@/lib/api";
import type { TokenResponse, User } from "@/types";

export const authService = {
  async register(name: string, email: string, password: string): Promise<TokenResponse> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { data } = await api.post<TokenResponse>("/api/auth/register", { name, email, password, timezone });
    return data;
  },
  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/api/auth/login", { email, password });
    return data;
  },
  async logout(): Promise<void> {
    await api.post("/api/auth/logout");
  },
  async me(): Promise<User> {
    const { data } = await api.get<User>("/api/auth/me");
    return data;
  },
};
