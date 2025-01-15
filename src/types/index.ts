// Re-export everything from individual type files
export * from './Programmer';
export * from './Project';
export * from './Chat';
export * from './Gitlab'

export interface AppUser {
  uid: string;
  email: string | null;
  role: string;
  company_id: number;
  name?: string;
  avatar_url?: string;
}