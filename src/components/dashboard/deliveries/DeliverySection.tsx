'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Delivery as DeliveryType } from '@/types/Project';
import { Project } from '@/types/Project';

interface DeliveryWithExtras extends DeliveryType {
  projectName: string;
  projectId: string;
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

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es });
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Entregas Pendientes</h2>
        <Button variant="outline">Ver Todas</Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-4 text-center">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-4 text-center text-red-500">
              {error}
            </CardContent>
          </Card>
        ) : deliveries.length === 0 ? (
          <Card>
            <CardContent className="py-4 text-center text-gray-500">
              No hay entregas pendientes
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{delivery.description || 'Sin descripción'}</h3>
                    <p className="text-sm text-gray-500">{delivery.projectName}</p>
                    {delivery.createdAt && (
                      <p className="text-sm text-gray-500">
                        Entregado el {formatDate(delivery.createdAt)}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(delivery.status)}>
                    {delivery.status === 'delivered' ? 'Entregada' :
                     delivery.status === 'reviewing' ? 'En Revisión' :
                     delivery.status === 'approved' ? 'Pendiente de Revisión' :
                     delivery.status === 'rejected' ? 'Rechazada' : 'Desconocido'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
