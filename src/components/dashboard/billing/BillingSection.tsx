'use client';

import { Invoice } from '@/types/Project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BillingSectionProps {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
}

export function BillingSection({ invoices, loading, error }: BillingSectionProps) {
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Sin fecha';
    try {
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
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'paid_by_client':
        return 'bg-green-100 text-green-800';
      case 'received_at_bank':
        return 'bg-purple-100 text-purple-800';
      case 'quality_control':
        return 'bg-yellow-100 text-yellow-800';
      case 'client_validation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'paid_by_client':
        return 'Pagada por cliente';
      case 'received_at_bank':
        return 'Recibida en banco';
      case 'quality_control':
        return 'Control de calidad';
      case 'client_validation':
        return 'Validación del cliente';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturación</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <p className="text-center text-gray-500">No hay facturas registradas</p>
            ) : (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">Factura #{invoice.number}</h3>
                      <p className="text-sm text-gray-500">
                        Proyecto: {invoice.projectName}
                      </p>
                    </div>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p>Fecha: {formatDate(invoice.date)}</p>
                      <p>Vencimiento: {formatDate(invoice.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p>Subtotal: ${invoice.subtotal.toLocaleString()}</p>
                      <p>Total: ${invoice.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
