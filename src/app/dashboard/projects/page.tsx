'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, CheckCircle, AlertCircle, Package, Clock } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/layout';
import { useProjects } from '@/hooks/useProjects';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const getProjectStatus = (backlog: any[] = []) => {
  if (!backlog.length) return { label: 'Sin tareas', color: 'bg-gray-100 text-gray-800' };
  
  const allTasksFinished = backlog.every(item => item.estado === 'Finalizado');
  
  if (allTasksFinished) {
    return { label: 'Finalizado', color: 'bg-green-100 text-green-800' };
  }
  
  return { label: 'Activo', color: 'bg-blue-100 text-blue-800' };
};

const getMilestoneProgress = (milestone: any, backlog: any[]) => {
  const milestoneBacklogItems = backlog.filter(item => item.milestone_id === milestone.id);
  if (!milestoneBacklogItems.length) return 0;
  
  const completedStates = ['Finalizado', 'Revisión por el cliente', 'Revisión'];
  const completed = milestoneBacklogItems.filter(item => 
    completedStates.includes(item.estado)
  ).length;
  return Math.round((completed / milestoneBacklogItems.length) * 100);
};

export default function ProjectsPage() {
  const { projects, loading, error } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("filteredProjects", filteredProjects);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-gray-600">Cargando proyectos...</p>
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No hay proyectos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? 'No se encontraron proyectos que coincidan con tu búsqueda.' 
              : 'No tienes ningún proyecto asignado en este momento.'}
          </p>
        </div>
      );
    }

    return filteredProjects.map((project) => {
      return (
        <Link 
          href={`/dashboard/projects/${project.id}`} 
          key={project.id}
          className="block"
        >
          <Card 
            className="hover:shadow-lg transition-all duration-300 border-l-4" 
            style={{ 
              borderLeftColor: project.status === 'completed' 
                ? '#22c55e' 
                : project.status === 'active' 
                  ? '#3b82f6' 
                  : '#eab308' 
            }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">{project.name}</h3>
                    <Badge className={`${project.status === 'completed' ? 'bg-green-100 text-green-800' : project.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {project.status === 'completed' ? 'Finalizado' : project.status === 'active' ? 'Activo' : 'Pendiente'}
                    </Badge>
                  </div>
                  {project.client && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <Package className="h-4 w-4 mr-2 text-gray-400" />
                      {project.client}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {project.milestones?.length > 0 && (
                    <Badge variant="secondary" className="flex items-center bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                      <Calendar className="h-3 w-3 mr-1" />
                      {project.milestones.length} hitos
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-6 pb-6 border-b border-gray-100">
                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Entregas pendientes</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {project.pendingDeliveries}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                    <span>Tickets pendientes</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {project.pendingTickets}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    <span>Incidencias pendientes</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {project.pendingIncidents}
                  </p>
                </div>
              </div>

              {project.milestones && project.milestones.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    Progreso de hitos
                  </h4>
                  <div className="space-y-4">
                    {project.milestones.map((milestone: any) => (
                      <div key={milestone.id} className="space-y-2 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="font-medium text-gray-700">
                              {milestone.title}
                              <span className="ml-2 text-gray-500">
                                ({milestone.totalTasks} tareas)
                              </span>
                            </span>
                          </div>
                          <Badge variant="secondary" className={
                            milestone.progress === 100 
                              ? 'bg-green-100 text-green-800' 
                              : milestone.progress > 50 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }>
                            {milestone.progress}%
                          </Badge>
                        </div>
                        <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                              milestone.progress === 100 
                                ? 'bg-green-500' 
                                : milestone.progress > 50 
                                  ? 'bg-blue-500'
                                  : 'bg-yellow-500'
                            }`}
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Link>
      );
    });
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Proyectos</h1>
          <Button>Nuevo Proyecto</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar por nombre de proyecto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="space-y-4">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
