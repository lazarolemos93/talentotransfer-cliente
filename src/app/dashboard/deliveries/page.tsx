'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/layout';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Timestamp } from 'firebase/firestore';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Video, Link, ExternalLink, CheckSquare, AlertCircle } from 'lucide-react';
import { Delivery as DeliveryType, Project, Milestone, Incident } from '@/types/Project';

interface Task {
  id: string;
  task: string;
  description?: string;
}

interface DeliveryWithExtras extends DeliveryType {
  projectName: string;
  milestone?: Milestone;
  incidents?: Incident[];
  isInvoiced?: boolean;
}

const isTimestamp = (value: any): value is Timestamp => {
  return value && typeof value === 'object' && 'seconds' in value;
};

export default function DeliveriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { projects, loading } = useProjects();
  const [expandedDeliveries, setExpandedDeliveries] = useState<Set<string>>(new Set());
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithExtras | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Obtener todas las entregas de todos los proyectos con sus hitos y tareas
  const deliveries = projects.flatMap(project => {
    return (project.deliveries || []).map((delivery: DeliveryType) => {
      // Encontrar el hito correspondiente
      const milestone = project.milestones?.find(m => m.id === delivery.milestoneId);
      
      // Encontrar las incidencias relacionadas
      const relatedIncidents = project.incidents
        ? project.incidents.filter(incident => 
            incident.status === 'open' || 
            incident.status === 'in_progress'
          )
          .map(incident => ({
            id: incident.id,
            title: incident.title,
            description: incident.description,
            status: incident.status
          }))
        : [];

      // Verificar si está facturado
      const isInvoiced = project.invoices?.some(invoice => 
        invoice.items?.some(item => item.backlogItemId === delivery.milestoneId)
      );
      
      return {
        ...delivery,
        projectName: project.name,
        milestone: milestone ? {
          id: milestone.id,
          title: milestone.title,
          date_end: milestone.date_end,
          dueDate: milestone.dueDate,
          project_id: milestone.project_id,
          status: milestone.status,
          backlogItems: milestone.backlogItems || []
        } : undefined,
        incidents: relatedIncidents,
        isInvoiced
      };
    });
  }).filter(delivery => delivery.status !== 'delivered');

  useEffect(() => {
    if (projects.length > 0) {
      // No hacer nada, ya que las entregas se obtienen directamente de useProjects
    }
  }, [projects]);

  const toggleExpanded = (deliveryId: string) => {
    const newExpanded = new Set(expandedDeliveries);
    if (newExpanded.has(deliveryId)) {
      newExpanded.delete(deliveryId);
    } else {
      newExpanded.add(deliveryId);
    }
    setExpandedDeliveries(newExpanded);
  };

  const handleReview = (delivery: DeliveryWithExtras, action: 'approve' | 'reject') => {
    setSelectedDelivery(delivery);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedDelivery || !reviewAction) return;

    setIsSubmitting(true);
    try {
      const deliveryRef = doc(db, 'projects', selectedDelivery.projectId, 'deliveries', selectedDelivery.id);
      
      if (reviewAction === 'approve') {
        await updateDoc(deliveryRef, {
          status: 'client_approved',
          reviewNotes: reviewComment,
          reviewedAt: Timestamp.now()
        });
        toast({
          title: "Entrega aprobada",
          description: "La entrega ha sido aprobada exitosamente.",
        });
        // Redirigir al proyecto
        router.push(`/dashboard/projects/${selectedDelivery.projectId}`);
      } else {
        await updateDoc(deliveryRef, {
          status: 'rejected',
          reviewNotes: reviewComment,
          reviewedAt: Timestamp.now()
        });
        toast({
          title: "Entrega rechazada",
          description: "La entrega ha sido rechazada.",
        });
      }

      setReviewDialogOpen(false);
      setReviewComment('');
      setSelectedDelivery(null);
      setReviewAction(null);
    } catch (error) {
      console.error('Error al procesar la revisión:', error);
      toast({
        title: "Error",
        description: "Hubo un error al procesar la revisión.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Entregada';
      case 'reviewing':
        return 'En Revisión';
      case 'approved':
        return 'Pendiente de Revisión';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Entregas</h1>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <Card className="p-6 text-center text-gray-500">
              Cargando entregas...
            </Card>
          ) : deliveries.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              No hay entregas disponibles
            </Card>
          ) : (
            <ScrollArea className="h-[600px] rounded-md border p-4">
              {deliveries.map((delivery) => (
                <Collapsible
                  key={delivery.id}
                  open={expandedDeliveries.has(delivery.id)}
                  onOpenChange={() => toggleExpanded(delivery.id)}
                  className="mb-6"
                >
                  <Card className="overflow-hidden border-none shadow-lg">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6">
                      <div className="flex flex-col space-y-4">
                        {/* Header Section */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {delivery.milestone?.title ? 
                                  `Entrega del Hito: ${delivery.milestone.title}` : 
                                  'Entrega sin hito asignado'
                                }
                              </h3>
                              <p className="text-sm text-gray-600">Proyecto: {delivery.projectName}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(delivery.status)}>
                                {getStatusText(delivery.status)}
                              </Badge>
                              {delivery.isInvoiced && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  Facturado
                                </Badge>
                              )}
                            </div>
                          </div>
                          {delivery.createdAt && (
                            <p className="text-sm text-gray-500">
                              Entregado el {format(
                                isTimestamp(delivery.createdAt)
                                  ? new Date(delivery.createdAt.seconds * 1000)
                                  : new Date(delivery.createdAt), 
                                "d 'de' MMMM, yyyy", 
                                { locale: es }
                              )}
                            </p>
                          )}
                        </div>

                        {/* Expand/Collapse Button */}
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-center gap-2">
                              {expandedDeliveries.has(delivery.id) ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  <span>Ocultar detalles</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  <span>Ver detalles</span>
                                </>
                              )}
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="p-6 space-y-8">
                        {/* Video Section */}
                        {delivery.loomUrl && (
                          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Video className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">Video de presentación</h4>
                                  <p className="text-sm text-gray-600">
                                    Demostración de las funcionalidades implementadas
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="aspect-video">
                              <iframe
                                src={delivery.loomUrl.replace('/share/', '/embed/')}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              ></iframe>
                            </div>
                          </div>
                        )}

                        {/* Testing URL Section */}
                        {delivery.testingUrl && (
                          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Link className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">URL de pruebas</h4>
                                  <p className="text-sm text-gray-600 mb-3">
                                    Acceda a este enlace para probar las nuevas funcionalidades
                                  </p>
                                  <a 
                                    href={delivery.testingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 break-all flex items-center gap-2 text-sm"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    {delivery.testingUrl}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tasks Section */}
                        {delivery.milestone?.backlogItems && delivery.milestone.backlogItems.length > 0 && (
                          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <CheckSquare className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">Tareas implementadas</h4>
                                  <p className="text-sm text-gray-600">
                                    {delivery.milestone.backlogItems.length} tareas completadas en este hito
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {delivery.milestone.backlogItems.map((task, index) => (
                                <div 
                                  key={task.id} 
                                  className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-gray-900">{task.task}</h5>
                                      {task.description && (
                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Incidents Section */}
                        {delivery.incidents && delivery.incidents.length > 0 && (
                          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                  <AlertCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">Incidencias reportadas</h4>
                                  <p className="text-sm text-gray-600">
                                    {delivery.incidents.length} incidencia(s) relacionada(s) con este hito
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {delivery.incidents.map(incident => (
                                <div 
                                  key={incident.id} 
                                  className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-red-500" />
                                      <div>
                                        <h5 className="font-medium text-gray-900">{incident.title}</h5>
                                        {incident.description && (
                                          <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                                        )}
                                      </div>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className="bg-red-50 text-red-700 ml-4"
                                    >
                                      {incident.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </ScrollArea>
          )}
        </div>
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Aprobar Entrega' : 'Rechazar Entrega'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comentarios de la revisión</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Escribe tus comentarios aquí..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={submitReview}
              disabled={isSubmitting}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {isSubmitting ? 'Procesando...' : reviewAction === 'approve' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
