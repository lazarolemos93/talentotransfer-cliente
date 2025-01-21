'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Delivery } from '@/types/Project';
import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface BillingStepProps {
  delivery: Delivery;
  paymentMethod: 'bank' | 'stripe' | 'dlocal' | null;
  setPaymentMethod: (value: 'bank' | 'stripe' | 'dlocal' | null) => void;
  currency: string;
  projectId: string;
  isInvoiced: boolean;
  companyData?: {
    name: string;
    taxId: string;
    address: string;
    billingEmail: string;
  };
}

interface Invoice {
  id: string;
  number: string;
  total: number;
  paymentUrl?: string;
  status: string;
}

interface InvoiceResponse {
  invoices: Invoice[];
}

export function BillingStep({
  delivery,
  paymentMethod,
  setPaymentMethod,
  currency,
  projectId,
  isInvoiced,
  companyData,
}: BillingStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkInvoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const functions = getFunctions();
        const checkInvoicesFunction = httpsCallable<any, InvoiceResponse>(functions, 'checkDeliveryInvoice');
        const result = await checkInvoicesFunction({
          projectId,
          deliveryId: delivery.id,
        });
        
        setInvoices(result.data.invoices);
      } catch (error) {
        console.error('Error checking invoices:', error);
        setError('Error al verificar las facturas');
      } finally {
        setIsLoading(false);
      }
    };

    checkInvoices();
  }, [delivery.id, projectId]);

  const handleStripePayment = async (invoice: Invoice) => {
    if (!invoice.id) return;
    
    setIsLoading(true);
    try {
      const functions = getFunctions();
      const createPaymentLink = httpsCallable(functions, 'createPaymentLink');
      const result = await createPaymentLink({ invoiceId: invoice.id });
      const { paymentUrl } = result.data as { paymentUrl: string };
      
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.id === invoice.id ? { ...inv, paymentUrl } : inv
        )
      );

      window.open(paymentUrl, '_blank');
    } catch (error) {
      console.error('Error creating payment link:', error);
      setError('Error al generar el enlace de pago');
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-4 px-6">
        {error && (
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Resumen de Facturación</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Facturas:</span>
              <span className="font-medium">{totalAmount.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-4">Facturas</h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map(invoice => (
                <div key={invoice.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Factura #{invoice.number}</span>
                    <span className="text-sm">{invoice.total.toFixed(2)} {currency}</span>
                  </div>
                  {paymentMethod === 'stripe' && !invoice.paymentUrl && (
                    <Button 
                      onClick={() => handleStripePayment(invoice)}
                      className="w-full mt-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando enlace de pago...
                        </>
                      ) : (
                        'Generar enlace de pago'
                      )}
                    </Button>
                  )}
                  {paymentMethod === 'stripe' && invoice.paymentUrl && (
                    <Button 
                      onClick={() => window.open(invoice.paymentUrl, '_blank')}
                      className="w-full mt-2"
                    >
                      Ir al pago seguro
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-4">Método de Pago</h4>
          <RadioGroup value={paymentMethod || ''} onValueChange={(value) => setPaymentMethod(value as 'bank' | 'stripe' | 'dlocal')}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank">Transferencia Bancaria</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe">Tarjeta de Crédito (Stripe)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dlocal" id="dlocal" />
                <Label htmlFor="dlocal">DLocal</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>
    </ScrollArea>
  );
}
