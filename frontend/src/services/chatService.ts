import { api } from "@/lib/api";
import type { ChatReply, ConversationDetail, ConversationSummary } from "@/types";

export const chatService = {
  async listConversations(): Promise<ConversationSummary[]> {
    const { data } = await api.get<ConversationSummary[]>("/api/chat/conversations");
    return data;
  },
  async createConversation(title?: string): Promise<ConversationDetail> {
    const { data } = await api.post<ConversationDetail>("/api/chat/conversations", { title: title ?? null });
    return data;
  },
  async getConversation(id: number): Promise<ConversationDetail> {
    const { data } = await api.get<ConversationDetail>(`/api/chat/conversations/${id}`);
    return data;
  },
  async sendMessage(conversationId: number, content: string): Promise<ChatReply> {
    const { data } = await api.post<ChatReply>(`/api/chat/conversations/${conversationId}/messages`, { content });
    return data;
  },
  async deleteConversation(id: number): Promise<void> {
    await api.delete(`/api/chat/conversations/${id}`);
  },
};
