'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Delivery as DeliveryType } from '@/types/Project';
import { Project } from '@/types/Project';
import { DeliveryFilter } from './DeliveryFilter';
import { RejectDeliveryDialog } from './RejectDeliveryDialog';
import { ApproveDeliveryDialog } from './ApproveDeliveryDialog';
import { CompanyBillingInfo } from '@/types/Payment';

interface DeliveryWithExtras extends DeliveryType {
  projectName: string;
  projectId: string;
  tasks?: { id: string; task: string; description?: string; }[];
  incidents?: {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'approved' | 'rejected' | 'waiting_delivery' | 'pending_client' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    updatedAt?: string;
    assignedTo?: string;
    reportedBy: string;
  }[];
  isInvoiced?: boolean;
}

interface DeliverySectionProps {
  projectId?: string;
  projects: Project[];
  loading: boolean;
  error: string | null;
}

const isTimestamp = (value: any): value is Timestamp => {
  return value && typeof value === 'object' && 'seconds' in value;
};

export function DeliverySection({ projectId, projects, loading, error }: DeliverySectionProps) {
  // Obtener todas las entregas pendientes de todos los proyectos
  const allDeliveries = projects.flatMap(project => {
    return (project.deliveries || []).map((delivery: DeliveryType) => ({
      ...delivery,
      projectName: project.name,
      projectId: project.id
    }));
  });

  // Filtrar las entregas según el projectId y el estado
  const deliveries = allDeliveries.filter(delivery => {
    const statusMatch = delivery.status === 'approved';
    if (projectId) {
      return statusMatch && delivery.projectId === projectId;
    }
    return statusMatch;
  });

  const formatDate = (date: string | Timestamp | Date | undefined | null) => {
    if (!date) return 'Sin fecha definida';
    
    try {
      let parsedDate: Date;
      
      if (isTimestamp(date)) {
        parsedDate = date.toDate();
      } else if (typeof date === 'string') {
        parsedDate = new Date(date);
      } else if (date instanceof Date) {
        parsedDate = date;
      } else {
        return 'Fecha inválida';
      }
      
      if (isNaN(parsedDate.getTime())) {
        return 'Fecha inválida';
      }
      
      return format(parsedDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const [selectedProject, setSelectedProject] = useState<string>(projectId || 'all');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithExtras | null>(null);
  const [companyData, setCompanyData] = useState<CompanyBillingInfo | null>(null);

  const filteredDeliveries = deliveries.filter(delivery => {
    if (selectedProject === 'all') {
      return true;
    }
    return delivery.projectId === selectedProject;
  });

  const handleRejectDelivery = (id: string, message: string) => {
    // Implementar lógica para rechazar la entrega
  };

  const handleApproveDelivery = (id: string) => {
    // Implementar lógica para aprobar la entrega
  };

  return (
    <div className="space-y-6">
      <DeliveryFilter
        projects={projects}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="space-y-4">
        {filteredDeliveries.map((delivery) => (
          <Card key={delivery.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{delivery.projectName}</h3>
                <p className="text-sm text-gray-600">
                  Entregado el {formatDate(delivery.submittedAt || delivery.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    setRejectDialogOpen(true);
                  }}
                >
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    setApproveDialogOpen(true);
                  }}
                >
                  Instalar en mi Servidor
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedDelivery && (
        <>
          <RejectDeliveryDialog
            isOpen={rejectDialogOpen}
            onClose={() => {
              setRejectDialogOpen(false);
              setSelectedDelivery(null);
            }}
            onConfirm={(message) => {
              handleRejectDelivery(selectedDelivery.id, message);
              setRejectDialogOpen(false);
              setSelectedDelivery(null);
            }}
            deliveryTitle={`${selectedDelivery.projectName} - ${formatDate(selectedDelivery.submittedAt)}`}
          />

          <ApproveDeliveryDialog
            isOpen={approveDialogOpen}
            onClose={() => {
              setApproveDialogOpen(false);
              setSelectedDelivery(null);
            }}
            delivery={selectedDelivery}
            tasks={selectedDelivery.tasks || []}
            incidents={selectedDelivery.incidents || []}
            onConfirm={() => handleApproveDelivery(selectedDelivery.id)}
            isInvoiced={selectedDelivery.isInvoiced || false}
            companyData={companyData || undefined}
          />
        </>
      )}
    </div>
  );
}
