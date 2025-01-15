'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import DashboardLayout from '@/components/dashboard/layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function IncidentsPage() {
  const { projects, loading, error } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener todas las incidencias de los proyectos
  const allIncidents = projects.flatMap(project => {
    return (project.incidents || []).map(incident => ({
      ...incident,
      projectName: project.name,
      projectId: project.id
    }));
  });

  // Filtrar incidencias por búsqueda
  const filteredIncidents = allIncidents.filter(incident =>
    incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Agrupar incidencias por estado
  const groupedIncidents = {
    open: filteredIncidents.filter(i => i.status === 'open'),
    approved: filteredIncidents.filter(i => i.status === 'approved'),
    in_progress: filteredIncidents.filter(i => i.status === 'in_progress'),
    resolved: filteredIncidents.filter(i => i.status === 'resolved'),
    closed: filteredIncidents.filter(i => i.status === 'closed'),
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
      case 'critical':
        return 'bg-purple-100 text-purple-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Sin fecha';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: es,
      });
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha inválida';
    }
  };

  const renderIncidentCard = (incident: any) => (
    <Card key={incident.id} className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{incident.title}</h3>
          <p className="text-sm text-gray-500">
            Proyecto: {incident.projectName}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className={getPriorityColor(incident.priority)}>
            {incident.priority}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          {incident.assignedTo ? `Asignado a: ${incident.assignedTo}` : 'Sin asignar'}
        </span>
        <span className="text-gray-500">
          {formatDate(incident.createdAt)}
        </span>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Incidencias</h1>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Incidencias</h1>
          </div>
          <Card className="p-4">
            <p className="text-red-500">{error}</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Incidencias</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar incidencias..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="approved" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="open">
              Nuevas ({groupedIncidents.open.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprobadas ({groupedIncidents.approved.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              En Progreso ({groupedIncidents.in_progress.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resueltas ({groupedIncidents.resolved.length})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Cerradas ({groupedIncidents.closed.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="mt-4 space-y-4">
              <TabsContent value="open" className="m-0">
                <div className="space-y-4">
                  {groupedIncidents.open.map(renderIncidentCard)}
                  {groupedIncidents.open.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay incidencias nuevas</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="approved" className="m-0">
                <div className="space-y-4">
                  {groupedIncidents.approved.map(renderIncidentCard)}
                  {groupedIncidents.approved.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay incidencias aprobadas</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="in_progress" className="m-0">
                <div className="space-y-4">
                  {groupedIncidents.in_progress.map(renderIncidentCard)}
                  {groupedIncidents.in_progress.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay incidencias en progreso</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="resolved" className="m-0">
                <div className="space-y-4">
                  {groupedIncidents.resolved.map(renderIncidentCard)}
                  {groupedIncidents.resolved.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay incidencias resueltas</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="closed" className="m-0">
                <div className="space-y-4">
                  {groupedIncidents.closed.map(renderIncidentCard)}
                  {groupedIncidents.closed.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay incidencias cerradas</p>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
