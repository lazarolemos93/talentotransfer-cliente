'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Project, Milestone, BacklogItem } from '@/types/Project';
import { FiGithub, FiList, FiMessageSquare, FiAlertCircle, FiBook, FiPackage, FiTag, FiXCircle } from 'react-icons/fi';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  size: string;
}

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    async function fetchProject() {
      if (!selectedCompany?.id) return;

      try {
        const projectRef = doc(db, 'projects', params.id as string);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          setError('Proyecto no encontrado');
          return;
        }

        const projectData = projectDoc.data();
        console.log("projectData.company_id", projectData.company_id, "selectedCompany.id", selectedCompany.id);
        // Verify company_id matches with the selected company
        if (projectData.company_id !== Number(selectedCompany.id)) {
          setError('No tienes acceso a este proyecto');
          return;
        }

        setProject({ id: projectDoc.id, ...projectData } as Project);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Error al cargar el proyecto');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [params.id, selectedCompany?.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cargando proyecto...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Proyecto no encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.client && <p className="text-gray-500 mt-1">Cliente: {project.client}</p>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Editar</Button>
            <Button>Gestionar Proyecto</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="mb-2">
                {project.status === 'active' ? 'Activo' :
                 project.status === 'completed' ? 'Completado' : 'En Espera'}
              </Badge>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Fecha de entrega</p>
                  <p className="font-medium">
                    {project.dueDate ? 
                      format(new Date(project.dueDate), "d 'de' MMMM, yyyy", { locale: es }) 
                      : 'No especificada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
               
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="milestones">Hitos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                {project.description ? (
                  <p className="text-gray-600">{project.description}</p>
                ) : (
                  <p className="text-gray-400 italic">Sin descripción</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Hitos del Proyecto</h3>
              <Button variant="outline">Agregar Hito</Button>
            </div>
            {milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{milestone.title}</h4>
                      <p className="text-sm text-gray-500">
                        Vence el {format(new Date(milestone.date_end || milestone.dueDate), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge>
                      {milestone.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Documentos</h3>
              <Button variant="outline">Subir Documento</Button>
            </div>
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{doc.name}</h4>
                      <p className="text-sm text-gray-500">
                        Subido el {format(doc.uploadedAt, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <Button variant="ghost">{doc.size}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
