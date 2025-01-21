'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PencilIcon, Save, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AppUser, Company } from "@/types";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CompaniesTabProps {
  user: AppUser | null;
  companies: Company[];
}

export function CompaniesTab({ user, companies }: CompaniesTabProps) {
  const { updateCompany } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<{ [key: string]: Company }>({});
  const [newEmployee, setNewEmployee] = useState({ email: '', password: '', name: '', role: 'employee' });
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  const startEditingCompany = (company: Company) => {
    setCompanyData({ 
      ...companyData, 
      [company.id]: { ...company } 
    });
    setEditingCompany(company.id);
  };

  const handleCompanyDataChange = (companyId: string, field: keyof Company, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value
      }
    }));
  };

  const saveCompanyChanges = async (companyId: string) => {
    setIsLoading(true);
    try {
      await updateCompany(companyId, companyData[companyId]);
      setEditingCompany(null);
      toast({
        title: "Datos actualizados",
        description: "Los datos de facturación se han actualizado correctamente",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar los datos",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = (companyId: string) => {
    return user?.company_id?.find(c => c.id === companyId)?.role === 'admin';
  };

  const handleAddEmployee = async (companyId: string) => {
    setIsAddingEmployee(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newEmployee.email,
        newEmployee.password
      );

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        company_id: [{
          id: companyId,
          role: 'employee'
        }],
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Empleado añadido",
        description: "El empleado ha sido añadido correctamente",
      });

      // Reset form
      setNewEmployee({ email: '', password: '', name: '', role: 'employee' });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo añadir el empleado",
      });
    } finally {
      setIsAddingEmployee(false);
    }
  };

  if (!user?.company_id || user.company_id.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Empresas</CardTitle>
          <CardDescription>No estás asociado a ninguna empresa</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {user.company_id.map((companyRole) => {
        const company = companies?.find(c => c.id === companyRole.id);
        const isEditing = editingCompany === companyRole.id;
        const editableCompany = isEditing ? companyData[companyRole.id] : company;
        
        if (!company) return null;
        
        return (
          <Card key={companyRole.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>{company.name}</CardTitle>
                  <CardDescription>Rol: {companyRole.role}</CardDescription>
                </div>
                {isAdmin(companyRole.id) && (
                  <div className="flex gap-2">
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => isEditing ? saveCompanyChanges(companyRole.id) : startEditingCompany(company)}
                      disabled={isLoading}
                    >
                      {isEditing ? (
                        <>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Guardar
                        </>
                      ) : (
                        <>
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Editar
                        </>
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Añadir Empleado
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Añadir Nuevo Empleado</DialogTitle>
                          <DialogDescription>
                            Crea un acceso para un nuevo empleado en {company.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium leading-none">Nombre</label>
                            <Input
                              value={newEmployee.name}
                              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium leading-none">Email</label>
                            <Input
                              type="email"
                              value={newEmployee.email}
                              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium leading-none">Contraseña</label>
                            <Input
                              type="password"
                              value={newEmployee.password}
                              onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                          <Button 
                            className="w-full mt-4"
                            onClick={() => handleAddEmployee(companyRole.id)}
                            disabled={isAddingEmployee}
                          >
                            {isAddingEmployee ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Añadir Empleado
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium leading-none">Razón Social</label>
                <Input
                  value={editableCompany?.razon_social || ''}
                  onChange={(e) => handleCompanyDataChange(companyRole.id, 'razon_social', e.target.value)}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium leading-none">Identificador Fiscal</label>
                <Input
                  value={editableCompany?.identificador_fiscal || ''}
                  onChange={(e) => handleCompanyDataChange(companyRole.id, 'identificador_fiscal', e.target.value)}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium leading-none">Dirección Fiscal</label>
                <Input
                  value={editableCompany?.direccion_fiscal || ''}
                  onChange={(e) => handleCompanyDataChange(companyRole.id, 'direccion_fiscal', e.target.value)}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
