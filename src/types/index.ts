// Re-export everything from individual type files
export * from './Programmer';
export * from './Project';
export * from './Chat';
export * from './Gitlab'

export interface AppUser {
  uid: string;
  email: string | null;
  role: string;
  contact: string;
  company_id: { id: string; role: string; }[];
  name?: string;
  avatar_url?: string;
  clientId?: string;
  createdAt?: string;
}