'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  dueDate?: string;
}

interface ProjectSectionProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

export function ProjectSection({ projects, loading, error }: ProjectSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDueDate = (dueDate: string | undefined) => {
    if (!dueDate) return 'Sin fecha definida';
    try {
      return `Vence el ${format(new Date(dueDate), "d 'de' MMMM, yyyy", { locale: es })}`;
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha inválida';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Proyectos Activos</h2>
        <Button variant="outline">Ver Todos</Button>
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
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-4 text-center text-gray-500">
              No hay proyectos activos
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDueDate(project.dueDate)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status === 'active' ? 'Activo' :
                     project.status === 'completed' ? 'Completado' : 'Pendiente'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm text-gray-500 mt-1">
                  {project.progress}%
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
