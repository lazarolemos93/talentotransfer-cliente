'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FolderKanban, Inbox, AlertCircle, TicketIcon, Receipt } from 'lucide-react';
import { ProjectSection } from '@/components/dashboard/projects/ProjectSection';
import { DeliverySection } from '@/components/dashboard/deliveries/DeliverySection';
import { IncidentSection } from '@/components/dashboard/incidents/IncidentSection';
import { TicketSection } from '@/components/dashboard/tickets/TicketSection';
import { BillingSection } from '@/components/dashboard/billing/BillingSection';

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  
  // Obtener todas las incidencias de los proyectos
  const allIncidents = projects.flatMap(project => {
    return (project.incidents || []).map(incident => ({
      ...incident,
      projectName: project.name,
      projectId: project.id
    }));
  }).filter(incident => incident.status === 'approved');

  // Obtener todos los tickets de los proyectos
  const allTickets = projects.flatMap(project => {
    return (project.tickets || []).map(ticket => ({
      ...ticket,
      projectName: project.name,
      projectId: project.id
    }));
  }).filter(ticket => ticket.clientVisible && ticket.status !== 'closed');

  // Estados para incidentes y tickets
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  if (!user) return null;

  const quickActions = [
    {
      title: 'Proyectos',
      icon: FolderKanban,
      href: '/dashboard/projects',
      description: 'Ver y gestionar proyectos activos'
    },
    {
      title: 'Entregas',
      icon: Inbox,
      href: '/dashboard/deliveries',
      description: 'Gestionar entregas pendientes'
    },
    {
      title: 'Incidencias',
      icon: AlertCircle,
      href: '/dashboard/incidents',
      description: 'Revisar incidencias reportadas'
    },
    {
      title: 'Tickets',
      icon: TicketIcon,
      href: '/dashboard/tickets',
      description: 'Gestionar tickets de soporte'
    },
    {
      title: 'Facturación',
      icon: Receipt,
      href: '/dashboard/billing',
      description: 'Ver facturas y pagos pendientes'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">
            Bienvenido, {user?.email}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <action.icon className="h-5 w-5 text-gray-500" />
                    <CardTitle>{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectSection 
                projects={projects}
                loading={projectsLoading}
                error={projectsError}
              />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliverySection 
                projects={projects}
                loading={projectsLoading}
                error={projectsError}
              />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Incidencias</CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentSection 
                incidents={allIncidents}
                loading={projectsLoading}
                error={projectsError || incidentsError}
              />
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketSection 
                tickets={allTickets}
                loading={projectsLoading}
                error={projectsError || ticketsError}
              />
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Facturación</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingSection 
                invoices={projects.flatMap(p => p.invoices)}
                loading={projectsLoading}
                error={projectsError}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
