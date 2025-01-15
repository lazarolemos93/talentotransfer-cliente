'use client';

import { Ticket } from '@/types/Project';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

interface TicketWithProject extends Ticket {
  projectId: string;
  projectName: string;
}

interface TicketsListProps {
  tickets: TicketWithProject[];
  selectedTicket: TicketWithProject | null;
  onSelectTicket: (ticket: TicketWithProject) => void;
}

export function TicketsList({ tickets, selectedTicket, onSelectTicket }: TicketsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
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
        return 'bg-green-100 text-green-800';
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

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar tickets..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className={cn(
                "p-4 rounded-lg cursor-pointer transition-colors",
                selectedTicket?.id === ticket.id
                  ? "bg-primary/10"
                  : "hover:bg-gray-100"
              )}
              onClick={() => onSelectTicket(ticket)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{ticket.title}</h3>
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {ticket.description}
              </p>
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No se encontraron tickets
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
