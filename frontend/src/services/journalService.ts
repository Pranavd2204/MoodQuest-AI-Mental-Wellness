import { api } from "@/lib/api";
import type { JournalEntry, JournalInput } from "@/types";

export const journalService = {
  async list(limit = 50): Promise<JournalEntry[]> {
    const { data } = await api.get<JournalEntry[]>("/api/journal", { params: { limit } });
    return data;
  },
  async get(id: number): Promise<JournalEntry> {
    const { data } = await api.get<JournalEntry>(`/api/journal/${id}`);
    return data;
  },
  async create(entry: JournalInput): Promise<JournalEntry> {
    const { data } = await api.post<JournalEntry>("/api/journal", entry);
    return data;
  },
  async update(id: number, entry: JournalInput): Promise<JournalEntry> {
    const { data } = await api.put<JournalEntry>(`/api/journal/${id}`, {
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      clear_mood: entry.mood === null,
    });
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/api/journal/${id}`);
  },
};
