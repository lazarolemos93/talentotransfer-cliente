'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import DashboardLayout from '@/components/dashboard/layout';
import { Card } from '@/components/ui/card';
import { Ticket } from '@/types/Project';
import { TicketsList } from '@/components/dashboard/tickets/TicketsList';
import { TicketChat } from '@/components/dashboard/tickets/TicketChat';

export default function TicketsPage() {
  const { projects, loading, error } = useProjects();
  const [selectedTicket, setSelectedTicket] = useState<(typeof allTickets)[0] | null>(null);

  // Obtener todos los tickets de los proyectos
  const allTickets = projects.flatMap(project => {
    return (project.tickets || []).map(ticket => ({
      ...ticket,
      projectId: project.id,
      projectName: project.name
    }));
  }).filter(ticket => ticket.clientVisible);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Tickets</h1>
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
            <h1 className="text-3xl font-bold">Tickets</h1>
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
          <h1 className="text-3xl font-bold">Tickets</h1>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 h-[calc(100vh-12rem)]">
            <TicketsList
              tickets={allTickets}
              selectedTicket={selectedTicket}
              onSelectTicket={setSelectedTicket}
            />
          </div>
          <div className="col-span-8 h-[calc(100vh-12rem)]">
            {selectedTicket ? (
              <TicketChat ticket={selectedTicket} />
            ) : (
              <Card className="h-full flex items-center justify-center text-gray-500">
                Selecciona un ticket para ver la conversación
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
