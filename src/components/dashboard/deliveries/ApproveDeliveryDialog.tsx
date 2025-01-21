'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; 
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Delivery } from '@/types/Project';
import { useAuth } from '@/context/AuthContext';
import { Check, AlertCircle, Info, Loader2, ArrowDown } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationStep } from './steps/ConfirmationStep';
import { addDeliveryHistory, updateTaskStatus, updateIncidentStatus, updateDeliveryStatus } from '@/services/api';
import { verifyDeliveryService } from '@/services/verifyDeliveryService';
import { BillingStep } from './steps/BillingStep';

interface ApproveDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery;
  tasks: { id: string; task: string; description?: string; }[];
  incidents: {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'approved' | 'rejected' | 'waiting_delivery' | 'pending_client' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    updatedAt?: string;
    assignedTo?: string;
    reportedBy: string;
  }[];
  onConfirm: (verificationData: { transactionId: string }) => void;
  isInvoiced: boolean;
  companyData?: {
    name: string;
    taxId: string;
    address: string;
    billingEmail: string;
  };
}

export function ApproveDeliveryDialog({
  isOpen,
  onClose,
  delivery,
  tasks,
  incidents,
  onConfirm,
  isInvoiced,
  companyData,
}: ApproveDeliveryDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepCompleted, setStepCompleted] = useState<Record<number, boolean>>({});
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'stripe' | 'dlocal' | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'initial' | 'code' | 'success'>('initial');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const currency = delivery.currency || 'EUR';
  const { toast } = useToast();
  const termsRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;

  const scrollToTerms = () => {
    if (termsRef.current) {
      termsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const startVerification = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await verifyDeliveryService.startVerification(user.contact);
      if (response.success && response.transactionId) {
        setTransactionId(response.transactionId);
        setVerificationStep('code');
        toast({
          title: "Código enviado",
          description: `Se ha enviado un código de verificación al número ${user.contact}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Error al enviar el código",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al iniciar la verificación",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (delivery.status === 'client_approve') {
        // Si ya está aprobado, simplemente avanzar al siguiente paso
        setCurrentStep(currentStep + 1);
        return;
      }
      
      if (verificationCode) {
        await handleVerifyCode();
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setTermsAccepted(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      });
      return;
    }

    if (!transactionId) {
      toast({
        title: "Error",
        description: "No hay un código de verificación activo",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyDeliveryService.approveDelivery({
        projectId: delivery.projectId,
        deliveryId: delivery.id,
        phoneNumber: user.contact,
        code: verificationCode,
        transactionId,
        tasks: tasks.map(t => ({ id: t.id })),
        incidents: incidents.map(i => ({ id: i.id }))
      });

      if (response.success) {
        setStepCompleted({ ...stepCompleted, 2: true });
        setVerificationStep('success');
        onConfirm({ transactionId });
      } else {
        toast({
          title: "Error",
          description: "Código de verificación inválido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: "Error",
        description: "Error al verificar el código",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (verificationStep === 'code') {
      setVerificationStep('initial');
      return;
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setTermsAccepted(false);
    }
  };

  const isNextEnabled = () => {
    if (delivery.status === 'client_approve') return true;
    
    if (currentStep === 1) {
      return stepCompleted[1] || (termsAccepted && verificationStep === 'code' && verificationCode.length > 0);
    }
    return true;
  };

  const steps = {
    1: {
      title: 'Confirmación de Entrega',
      content: (
        <ConfirmationStep
          delivery={delivery}
          tasks={tasks}
          incidents={incidents}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
          termsRef={termsRef}
          verificationStep={verificationStep}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          setVerificationStep={setVerificationStep}
          isLoading={isLoading}
          stepCompleted={stepCompleted[1]}
          user={user}
          onSendSMS={startVerification}
        />
      ),
    },
    2: {
      title: 'Facturación',
      content: (
        <BillingStep
          delivery={delivery}
          isInvoiced={isInvoiced}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod} 
          currency={currency}
          companyData={companyData}
          projectId={delivery.projectId.toString()}
        />
      ),
    },
    3: {
      title: 'Instalación',
      content: (
        <div className="space-y-6">
          <p>
            La entrega ha sido aprobada y está lista para ser instalada en su servidor.
            Al hacer clic en &quot;Instalar en mi Servidor&quot;, comenzará el proceso de instalación.
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <p className="text-yellow-800 font-medium">
                Asegúrese de tener una copia de seguridad de su servidor antes de proceder con la instalación.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {steps[currentStep as keyof typeof steps].title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          <div className="flex justify-center space-x-4 mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-primary text-white' : 'bg-gray-200'
                }`}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`h-0.5 w-12 ${
                    currentStep > step ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            {steps[currentStep as keyof typeof steps].content}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t mt-auto">
          <div className="flex flex-col w-full space-y-2">
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Atrás
              </Button>
              {currentStep === 2 && verificationStep === 'code' ? (
                <Button
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6 || isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verificar Código
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!isNextEnabled()}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentStep === 3 ? 'Instalar en mi Servidor' : 'Siguiente'}
                </Button>
              )}
            </div>
            {currentStep === 1 && !termsAccepted && (
              <div className="flex items-center justify-end space-x-2 text-sm text-red-500">
                <span>Debes aceptar los términos y condiciones para continuar</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-red-500 hover:text-red-600"
                  onClick={scrollToTerms}
                >
                  <ArrowDown className="w-4 h-4 mr-1" />
                  Ver términos
                </Button>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
