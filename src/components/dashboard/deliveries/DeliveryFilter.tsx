'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Project } from '@/types/Project';

interface DeliveryFilterProps {
  projects: Project[];
  selectedProject: string;
  onProjectChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTab: string;
  onTabChange: (value: string) => void;
}

export function DeliveryFilter({
  projects,
  selectedProject,
  onProjectChange,
  searchTerm,
  onSearchChange,
  selectedTab,
  onTabChange
}: DeliveryFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <Input
          placeholder="Buscar por descripción..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Select value={selectedProject} onValueChange={onProjectChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar proyecto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los proyectos</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedTab} onValueChange={onTabChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pending">Pendientes</SelectItem>
          <SelectItem value="approved">Aprobados</SelectItem>
          <SelectItem value="rejected">Rechazados</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
