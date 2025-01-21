'use client';

import { useEffect } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Delivery, Task, Incident } from '@/types/Project';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ResendSMSButton } from './ResendSMSButton';

interface ConfirmationStepProps {
  delivery: Delivery;
  tasks: Task[];
  incidents: Incident[];
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
  termsRef: React.RefObject<HTMLDivElement>;
  verificationStep: 'initial' | 'code' | 'success';
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  setVerificationStep: (value: 'initial' | 'code' | 'success') => void;
  isLoading: boolean;
  stepCompleted?: boolean;
  user: any;
  onSendSMS: () => Promise<void>;
}

export function ConfirmationStep({
  delivery,
  tasks,
  incidents,
  termsAccepted,
  setTermsAccepted,
  termsRef,
  verificationStep,
  verificationCode,
  setVerificationCode,
  setVerificationStep,
  isLoading,
  stepCompleted,
  user,
  onSendSMS
}: ConfirmationStepProps) {

  const isApproved = delivery.status === 'client_approve';

  // Solo enviar SMS si no está aprobado
  useEffect(() => {
    if (!isApproved && termsAccepted && verificationStep === 'initial') {
      onSendSMS();
    }
  }, [termsAccepted, verificationStep, onSendSMS, isApproved]);

  const handleTermsAccept = (checked: boolean) => {
    if (!isApproved) {
      setTermsAccepted(checked);
    }
  };

  const { user: authUser } = useAuth();
  const router = useRouter();

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-4 px-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-base">Resumen de la Entrega</h3>
          <p className="text-gray-600 text-sm">
            {isApproved 
              ? "La entrega ha sido aprobada. Puede continuar al siguiente paso."
              : "Por favor, revise los detalles antes de confirmar."
            }
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-3">
            <h4 className="font-medium text-primary text-sm mb-2">Tareas Completadas</h4>
            <div className="h-[250px] overflow-auto pr-2">
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{task.task}</p>
                      {task.description && (
                        <p className="text-xs text-gray-600">{task.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {incidents.length > 0 && (
            <div className="bg-white rounded-lg border p-3">
              <h4 className="font-medium text-primary text-sm mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Incidencias Resueltas
              </h4>
              <div className="h-[250px] overflow-auto pr-2">
                <ul className="space-y-2">
                  {incidents.map((incident) => (
                    <li key={incident.id} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{incident.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div className="space-y-3">
                <h4 className="font-medium text-blue-900">Términos de Aceptación</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Ha podido revisar y validar todas las tareas y funcionalmente están correctas y cumplen con los requisitos establecidos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>En el siguiente paso se le generará su factura y el enlace de pago para que realice el deposito del monto.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Acepta que empieza su control de 60 días y que puede abrir incidencias de manera gratuita durante ese tiempo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Una vez pasado el control de calidad recién ahí se liberan los fondos a nuestro partner encargado de la entrega.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Una vez realizado el pago podrá dar los datos para la instalación del sistema en sus servidores. Recomendamos NO hacer instalaciones en servidor de producción directamente.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div ref={termsRef} className="space-y-4 mt-6">
            {isApproved ? (
              <div className="flex items-center space-x-2 bg-green-50 p-4 rounded-lg border border-green-200">
                <Check className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <span className="text-green-800 font-medium block">Entrega Aprobada</span>
                  <span className="text-green-600 text-sm">Todos los términos han sido aceptados. Puede continuar al siguiente paso.</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={handleTermsAccept}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Acepto los términos y condiciones
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Al marcar esta casilla, confirmo que he revisado y acepto todos los detalles de la entrega.
                    </p>
                  </div>
                </div>

                {termsAccepted && !isApproved && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-blue-800 font-medium">
                            Verificación por SMS
                          </p>
                          <p className="text-sm text-blue-700">
                            Para confirmar su identidad, enviaremos un código de verificación al número {user.contact}.
                          </p>
                        </div>
                      </div>
                    </div>

                    {verificationStep === 'code' && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-3">
                            Hemos enviado un código de verificación a su número de teléfono. 
                            Por favor, introdúzcalo a continuación:
                          </p>
                          <div className="flex items-center space-x-3">
                            <Input
                              type="text"
                              placeholder="Código de verificación"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              maxLength={6}
                              className="max-w-[200px]"
                            />
                            <ResendSMSButton onResend={onSendSMS} isLoading={isLoading} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
