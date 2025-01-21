'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'approved' | 'rejected' | 'waiting_delivery' | 'pending_client' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string | any;
  updatedAt?: string;
  assignedTo?: string;
  reportedBy: string;
  projectName: string;
  projectId: string;
}

interface IncidentSectionProps {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
}

export function IncidentSection({ incidents, loading, error }: IncidentSectionProps) {
  const formatDate = (dateStr: string | { toDate: () => Date } | undefined) => {
    if (!dateStr) return 'Sin fecha definida';
    try {
      // Handle Firebase Timestamp objects
      if (typeof dateStr === 'object' && 'toDate' in dateStr) {
        return format(dateStr.toDate(), "d 'de' MMMM, yyyy", { locale: es });
      }
      
      // Handle string dates
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'critical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Incidencias Recientes</h2>
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
        ) : incidents.length === 0 ? (
          <Card>
            <CardContent className="py-4 text-center text-gray-500">
              No hay incidencias recientes
            </CardContent>
          </Card>
        ) : (
          incidents.map((incident) => (
            <Card key={incident.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{incident.title}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(incident.createdAt)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Proyecto: {incident.projectName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(incident.priority)}>
                      {incident.priority}
                    </Badge>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
