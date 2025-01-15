import { Timestamp } from 'firebase/firestore';

export type TicketStatus = 'open' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketType = 'analisis' | 'technical' | 'functional';
export type MessageType = 'text' | 'system';

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  createdAt: Date;
  senderId: string;
  senderName: string;
  senderRole: string;
  type: MessageType;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  projectName: string;
  type: TicketType;
  assignedTo: string;
  assignedToName: string;
  assignedToRole: string;
}
