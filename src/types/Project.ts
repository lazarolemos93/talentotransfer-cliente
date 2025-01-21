import { Timestamp } from "firebase/firestore";

export interface Milestone {
  id: string;
  title: string;
  date_end: string | null;
  dueDate: string;
  project_id: string;
  status: 'completed' | 'pending';
  backlogItems?: BacklogItem[];
}

export interface BacklogItem {
  id: string;
  task: string;
  description: string | null;
  estado: string;
  estimate: string;
  facturado: number;
  milestone_id: string;
  project_id: string;
  assigned_user?: string;
  assigned_user_name?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'approved' | 'rejected' | 'waiting_delivery' | 'pending_client' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt?: string;
  assignedTo?: string;
  reportedBy: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number; 
  url: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: 'video' | 'audio';
  date: string;
  link: string;
  transcription: string;
  created_at: string;
  duration?: number;
  attendees?: string[];
  notes?: string;
  recordingUrl?: string;
}

export interface Task {
  id: string;
  task: string;
  description?: string;
}

export interface Delivery {
  id: string;
  projectId: string | number;  // Puede ser string o number
  milestoneId: string;
  programmerId: string;
  loomUrl: string;
  testingUrl: string;
  description?: string;
  status: 'delivered' | 'reviewing' | 'rejected' | 'approved' | 'client_rejected' | 'client_approve' | 'waiting_install' | 'server_installed';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  reviewedAt?: Timestamp;
  submittedAt?: Timestamp;
  reviewNotes?: string;
  relatedIncidents?: Incident[];
  history?: {
    loomUrl: string;
    description?: string;
    createdAt: Timestamp;
    status: 'delivered' | 'reviewing' | 'approved' | 'rejected' | 'client_approve';
    reviewNotes?: string;
  }[];
  currency?: 'USD' | 'EUR';
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  clientVisible: boolean;
  createdAt: string;
  updatedAt?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  number: string;
  date: string;
  dueDate: string;
  items: {
    task: string;
    description: string | null;
    hours: number;
    rate: number;
    amount: number;
    backlogItemId: string;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'confirmed' | 'paid_by_client' | 'received_at_bank' | 'quality_control' | 'client_validation';
}

export interface Project {
  id: string;
  name: string;
  opportunity_id: string;
  gitlab_id?: string;
  company_id?: number;
  client?: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  description?: string;
  pendingDeliveries: number;
  pendingTickets: number;
  pendingIncidents: number;
  milestones: Milestone[];
  backlog: BacklogItem[];
  incidents: Incident[];
  notes: Note[];
  documents: Document[];
  meetings: Meeting[];
  deliveries: Delivery[];
  tickets: Ticket[];
  invoices: Invoice[];
  visible: number;
  ppc?: number;
  ppp?: number;
  dueDate?: string;
  startDate?: string;
}

export interface Company {
  id: string;
  name: string;
  crm_id: string;
  razon_social: string;
  identificador_fiscal: string;
  direccion_fiscal: string;
  currency?: 'USD' | 'EUR';
}

export interface CompanyData {
  name: string;
  taxId: string;
  address: string;
  billingEmail: string;
  host?: string;
  port?: string;
  database?: string;
  additionalInfo?: string;
}