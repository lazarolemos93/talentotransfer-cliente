'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

interface PhoneVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PhoneData {
  currentPassword: string;
  newPhoneNumber: string;
  verificationCode: string;
  showVerification: boolean;
  transactionId: string;
}

interface StartVerificationResponse {
  success: boolean;
  transactionId: string;
  error?: string;
}

interface CheckVerificationResponse {
  success: boolean;
  status: string;
  error?: string;
}

interface CloudFunctionError {
  code: string;
  message: string;
  details?: any;
}

export function PhoneVerificationDialog({ open, onOpenChange }: PhoneVerificationDialogProps) {
  const { updateUserProfile, verifyCurrentPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [phoneData, setPhoneData] = useState<PhoneData>({
    currentPassword: '',
    newPhoneNumber: '',
    verificationCode: '',
    showVerification: false,
    transactionId: ''
  });

  const handleUpdatePhone = async () => {
    console.log('🚀 Iniciando handleUpdatePhone');

    if (!phoneData.currentPassword || !phoneData.newPhoneNumber) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos",
        duration: 5000,
      });
      return;
    }

    // Validar formato del número de teléfono
    const phoneRegex = /^\+\d{1,15}$/;
    if (!phoneRegex.test(phoneData.newPhoneNumber)) {
      toast({
        variant: "destructive",
        title: "Número inválido",
        description: "El número debe estar en formato internacional",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verificar contraseña
      try {
        await verifyCurrentPassword(phoneData.currentPassword);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "La contraseña es incorrecta",
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      // 2. Enviar código
      const functions = getFunctions();
      const startVerification = httpsCallable(functions, 'startVerification');
      
      const result = await startVerification({
        phoneNumber: phoneData.newPhoneNumber
      }) as HttpsCallableResult<StartVerificationResponse>;
      
      if (!result.data.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.data.error || "No se pudo enviar el código de verificación",
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      setPhoneData(prev => ({ 
        ...prev, 
        showVerification: true,
        transactionId: result.data.transactionId 
      }));
      
      toast({
        title: "Código enviado",
        description: "Se ha enviado un código de verificación a tu nuevo número",
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneData.verificationCode) {
      toast({
        variant: "destructive",
        title: "Código requerido",
        description: "Por favor, ingresa el código de verificación",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const functions = getFunctions();
      const checkVerification = httpsCallable(functions, 'checkVerification');
      
      const result = await checkVerification({
        phoneNumber: phoneData.newPhoneNumber,
        code: phoneData.verificationCode,
        transactionId: phoneData.transactionId
      }) as HttpsCallableResult<{ success: boolean; status: string; error?: string }>;

      if (result.data.success) {
        const auth = getAuth();
        if (auth.currentUser) {
          // Refresh the user data to get the updated phone number
          await auth.currentUser.reload();
        }
        
        toast({
          title: "Teléfono actualizado",
          description: "Tu número de teléfono ha sido actualizado correctamente",
          duration: 5000,
        });
        handleClose();
      } else {
        toast({
          variant: "destructive",
          title: "Error de verificación",
          description: result.data.error || "El código de verificación es incorrecto",
          duration: 5000,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Ha ocurrido un error inesperado",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneData({
      currentPassword: '',
      newPhoneNumber: '',
      verificationCode: '',
      showVerification: false,
      transactionId: ''
    });
    onOpenChange(false);
  };

  const formatPhoneNumber = (value: string): string => {
    // Asegurarnos de que empiece con +
    if (!value.startsWith('+')) {
      value = '+' + value;
    }
    
    // Eliminar todos los espacios y caracteres no numéricos excepto el +
    return value.replace(/[^\d+]/g, '');
  };

  const phoneRegex = /^\+\d{1,15}$/;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Número de Teléfono</DialogTitle>
          <DialogDescription>
            {!phoneData.showVerification 
              ? "Para cambiar tu número de teléfono, primero ingresa tu contraseña actual"
              : "Ingresa el código de verificación enviado a tu nuevo número"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!phoneData.showVerification ? (
            <>
              <div>
                <label className="text-sm font-medium leading-none">Contraseña Actual</label>
                <Input
                  type="password"
                  value={phoneData.currentPassword}
                  onChange={(e) => setPhoneData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium leading-none">Nuevo Número de Teléfono</label>
                <Input
                  type="tel"
                  placeholder="+34600000000"
                  value={phoneData.newPhoneNumber}
                  onChange={(e) => {
                    const formattedNumber = formatPhoneNumber(e.target.value);
                    setPhoneData(prev => ({ ...prev, newPhoneNumber: formattedNumber }))
                  }}
                  className="mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  <p>El número debe estar en formato internacional:</p>
                  <p>• Debe empezar con + seguido del código del país</p>
                  <p>• Sin espacios ni caracteres especiales</p>
                  <p>Ejemplos: +34600000000, +1234567890, +447123456789</p>
                  {phoneData.newPhoneNumber && !phoneRegex.test(phoneData.newPhoneNumber) && (
                    <p className="text-destructive">
                      El número debe empezar con + y contener solo dígitos
                    </p>
                  )}
                </div>
              </div>
              <Button 
                className="w-full mt-4"
                onClick={handleUpdatePhone}
                disabled={isLoading || !phoneData.currentPassword || !phoneData.newPhoneNumber || !phoneRegex.test(phoneData.newPhoneNumber)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                Enviar Código de Verificación
              </Button>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium leading-none">Código de Verificación</label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={phoneData.verificationCode}
                  onChange={(e) => setPhoneData(prev => ({ ...prev, verificationCode: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <Button 
                className="w-full mt-4"
                onClick={handleVerifyPhone}
                disabled={isLoading || !phoneData.verificationCode}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                Verificar y Actualizar Teléfono
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
