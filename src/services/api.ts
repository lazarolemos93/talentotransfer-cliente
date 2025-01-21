import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

interface HistoryEntry {
  type: 'status_change' | 'comment' | 'update';
  message: string;
  createdBy: string | undefined;
  timestamp: Date;
}

export async function addDeliveryHistory(deliveryId: string, entry: HistoryEntry) {
  const deliveryRef = doc(db, 'deliveries', deliveryId);
  await updateDoc(deliveryRef, {
    history: arrayUnion({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    })
  });
}

export async function updateTaskStatus(taskId: string, status: string) {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    status: status,
    updatedAt: new Date().toISOString()
  });
}

export async function updateIncidentStatus(incidentId: string, status: 'closed') {
  const incidentRef = doc(db, 'incidents', incidentId);
  await updateDoc(incidentRef, {
    status: status,
    updatedAt: new Date().toISOString()
  });
}

export async function updateDeliveryStatus(deliveryId: string, status: 'delivered' | 'reviewing' | 'approved' | 'client_approve' | 'ready_for_install' | 'rejected') {
  const deliveryRef = doc(db, 'deliveries', deliveryId);
  await updateDoc(deliveryRef, {
    status: status,
    updatedAt: new Date().toISOString()
  });
}
