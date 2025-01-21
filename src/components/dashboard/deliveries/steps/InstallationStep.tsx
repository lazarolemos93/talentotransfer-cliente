'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompanyData } from '@/types/Project';

interface InstallationStepProps {
  companyData: CompanyData;
}

export function InstallationStep({
  companyData,
}: InstallationStepProps) {
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-6 px-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Datos de Instalación</h4>
            <p className="text-sm text-gray-600">
              Por favor, proporcione los datos necesarios para la instalación del sistema.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                placeholder="ejemplo.com"
                defaultValue={companyData?.host || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Puerto</Label>
              <Input
                id="port"
                placeholder="3000"
                defaultValue={companyData?.port || ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Base de Datos</Label>
            <Input
              id="database"
              placeholder="nombre_db"
              defaultValue={companyData?.database || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional">Información Adicional</Label>
            <Textarea
              id="additional"
              placeholder="Cualquier información adicional relevante para la instalación..."
              className="min-h-[100px]"
              defaultValue={companyData?.additionalInfo || ''}
            />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Importante</h4>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Asegúrese de que el servidor cumple con los requisitos mínimos del sistema</li>
            <li>Recomendamos realizar la instalación en un entorno de pruebas primero</li>
            <li>Tenga a mano las credenciales de acceso necesarias</li>
            <li>Realice una copia de seguridad antes de proceder con la instalación</li>
          </ul>
        </div>
      </div>
    </ScrollArea>
  );
}
