'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Phone } from "lucide-react";
import { AppUser } from "@/types";
import { ChangePasswordDialog, PhoneVerificationDialog } from './security';

interface SecurityTabProps {
  user: AppUser | null;
}

export function SecurityTab({ user }: SecurityTabProps) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguridad de la Cuenta</CardTitle>
        <CardDescription>Gestiona tu contraseña y verificaciones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-4">Cambiar Contraseña</h3>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowPasswordDialog(true)}
          >
            <Lock className="h-4 w-4 mr-2" />
            Cambiar Contraseña
          </Button>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-4">Cambio de Teléfono</h3>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowPhoneDialog(true)}
          >
            <Phone className="h-4 w-4 mr-2" />
            Cambiar Teléfono
          </Button>
        </div>
      </CardContent>

      {/* Diálogos */}
      <ChangePasswordDialog 
        open={showPasswordDialog} 
        onOpenChange={setShowPasswordDialog} 
      />
      
      <PhoneVerificationDialog 
        open={showPhoneDialog} 
        onOpenChange={setShowPhoneDialog} 
      />
    </Card>
  );
}