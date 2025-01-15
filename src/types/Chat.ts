// src/features/chat/types/index.ts
export type MessageVisibility = 'team' | 'client';
export type MessageStatus = 'pending' | 'approved' | 'rejected';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  visibility: MessageVisibility;
  status: MessageStatus;
  projectId: string;
  avatarUrl?: string;
}