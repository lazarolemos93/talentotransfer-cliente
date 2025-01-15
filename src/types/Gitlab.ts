import { HttpsCallable } from 'firebase/functions';

// Frontend interfaces
export interface StepStatus {
  isLoading: boolean;
  status: 'idle' | 'success' | 'error';
  message: string;
}

export interface GitLabUserDetails {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
}

export interface ProjectData {
  http_url_to_repo: string;
  web_url: string;
  name: string;
}

// Response interfaces
interface BaseResponse {
  success: boolean;
  message: string;
}

export interface GitLabFunctionResponse extends BaseResponse {
  data: GitLabUserDetails;
}

export interface CreateBranchResponse extends BaseResponse {
  data: {
    branchName: string;
    projectUrl: string;
    expiresAt: string;
  };
}

// Request interfaces
export interface ProjectDetailsParams {
  projectId: string;
}

export interface GitLabUserVerifyRequest {
  userId: string;
}

export interface GitLabAddUserRequest {
  projectId: string;
  userId: string;
  accessLevel?: number;
}

export interface GitLabRemoveUserRequest {
  projectId: string;
  userId: string;
}

export interface CheckMembershipRequest {
  projectId: string;
  userId: string;
}

export interface GitLabInitialAccessRequest {
  projectId: string;
  userId: string;
}

export interface GitLabCheckCloneRequest {
  projectId: string;
  userId: string;
}

export interface ValidationPushResponse extends BaseResponse {
  data: {
    validated: boolean;
    lastCommit?: {
      message: string;
    };
  };
}

export interface ProjectDetailsResponse {
  data: {
    success: boolean;
    data: ProjectData;
    message: string;
  };
}