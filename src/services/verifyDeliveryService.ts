import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

const functions = getFunctions(app);

interface StartVerificationResponse {
  success: boolean;
  transactionId: string;
  error?: string;
}

interface ApproveDeliveryRequest {
  projectId: string | number;  // Puede ser string o number
  deliveryId: string;
  phoneNumber: string;
  code: string;
  transactionId: string;
  tasks: { id: number | string }[];
  incidents: { id: string }[];
}

interface ApproveDeliveryResponse {
  success: boolean;
  error?: string;
}

export const verifyDeliveryService = {
  startVerification: async (phoneNumber: string): Promise<StartVerificationResponse> => {
    const startVerificationFn = httpsCallable(functions, 'startVerification');
    const result = await startVerificationFn({ phoneNumber });
    return result.data as StartVerificationResponse;
  },

  approveDelivery: async (params: ApproveDeliveryRequest): Promise<ApproveDeliveryResponse> => {
    const { projectId, deliveryId, code, transactionId } = params;
    const approveDeliveryFn = httpsCallable(functions, 'approveDelivery');
    const result = await approveDeliveryFn({ projectId, deliveryId, code, transactionId });
    return result.data as ApproveDeliveryResponse;
  }
};
