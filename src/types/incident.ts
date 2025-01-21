export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'approved' | 'rejected' | 'waiting_delivery' | 'pending_client' | 'closed';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  projectName: string;
  createdAt: { toDate(): Date } | string | Date;
  updatedAt?: { toDate(): Date } | string | Date;
  createdBy: string;
  assignedTo?: string;
  loom_url?: string;
  attachments?: string[];
  related_backlog_items?: string[];
}
