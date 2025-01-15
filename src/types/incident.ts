export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'approved' | 'rejected' | 'completed';
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
