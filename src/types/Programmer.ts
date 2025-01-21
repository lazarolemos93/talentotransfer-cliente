import { Timestamp } from "firebase/firestore";

export interface Skill {
  technology: string;
  level: number;
}

export interface Programmer {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    blocked: boolean;
    technologies: string;
    talent_id?: string;
    postulacion_id?: string;
    projectId?: string;
  }
  

export interface ProgrammerCompany {
  id: string;
  name: string;
  crm_id: string;
  razon_social: string;
  identificador_fiscal: string;
  direccion_fiscal: string;
  currency?: 'USD' | 'EUR';
}

export interface CompanyRole {
  id: string;
  role: string;
}

export interface AppUser {
  uid: string;
  clientId: string;
  company_id: CompanyRole[];
  contact: string;
  createdAt: string;
  email: string;
  name: string;
  role: string;
}

export interface Profile {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    taxId: string;
    country: string;
    documentId?: string;
    status: string;
    fiscalAddress: string;
    gitlabUser: string;
    gitlab_validated: boolean;
    skills: Skill[];
    userId: string;
    created_at: Timestamp;
    updated_at: Timestamp;
  }
  
  export interface ProjectProgrammer {
    id: string;
    project_id: string;
    programmer_id: string;
  }