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
import { DeliveryFilter } from '@/components/dashboard/deliveries/DeliveryFilter';
import { RejectDeliveryDialog } from '@/components/dashboard/deliveries/RejectDeliveryDialog';
import { ApproveDeliveryDialog } from '@/components/dashboard/deliveries/ApproveDeliveryDialog';
import { CompanyBillingInfo } from '@/types/Payment';

interface Task {
  id: string;
  task: string;
  description?: string;
}

interface DeliveryWithExtras extends DeliveryType {
  projectName: string;
  milestone?: Milestone;
  relatedIncidents?: Incident[];
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
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('pending_approval');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyBillingInfo | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithExtras | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'reviewing':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Entregada';
      case 'reviewing':
        return 'En Revisión';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  // Obtener todas las entregas de todos los proyectos con sus hitos y tareas
  const deliveries = projects.flatMap(project => {
    console.log("project.devliveries ", project.deliveries)
    return (project.deliveries || []).map((delivery: DeliveryType) => {
      // Encontrar el hito correspondiente
      const milestone = project.milestones?.find(m => m.id === delivery.milestoneId);
      
      // Encontrar las incidencias relacionadas
      const relatedIncidents = project.incidents
        ? project.incidents.filter(incident => 
            incident.status !== 'open'
          )
          .map(incident => ({
            id: incident.id,
            title: incident.title,
            description: incident.description,
            status: incident.status,
            priority: incident.priority,
            createdAt: incident.createdAt,
            updatedAt: incident.updatedAt,
            assignedTo: incident.assignedTo,
            reportedBy: incident.reportedBy
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
        relatedIncidents,
        isInvoiced
      };
    });
  });

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

  const formatDate = (date: string | Timestamp | Date) => {
    try {
      let parsedDate: Date;
      
      if (isTimestamp(date)) {
        parsedDate = date.toDate();
      } else if (typeof date === 'string') {
        parsedDate = new Date(date);
      } else if (date instanceof Date) {
        parsedDate = date;
      } else {
        console.error('Unexpected date format:', date);
        return 'Fecha inválida';
      }
      
      if (isNaN(parsedDate.getTime())) {
        console.error('Invalid parsed date:', parsedDate);
        throw new Error('Invalid date');
      }
      
      return format(parsedDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha inválida';
    }
  };

  const tabs = [
    {
      id: 'pending_approval',
      label: 'Pendientes de Aprobación',
      description: 'Entregas que necesitan tu aprobación',
      states: ['approved']
    },
    {
      id: 'pending_payment',
      label: 'Pendientes de Pago',
      description: 'Entregas aprobadas pendientes de pago',
      states: ['client_approve']
    },
    {
      id: 'installing',
      label: 'En Instalación',
      description: 'Entregas en proceso de instalación',
      states: ['waiting_install']
    },
    {
      id: 'completed',
      label: 'Completadas',
      description: 'Entregas instaladas en el servidor',
      states: ['server_installed']
    },
    {
      id: 'rejected',
      label: 'Rechazadas',
      description: 'Entregas rechazadas por el cliente',
      states: ['client_rejected']
    }
  ];

  const filteredDeliveries = deliveries.filter(delivery => {
    // Filtrar por proyecto
    if (selectedProject !== 'all' && delivery.projectId !== selectedProject) {
      return false;
    }

    // Obtener los estados correspondientes al tab seleccionado
    const currentTab = tabs.find(tab => tab.id === selectedTab);
    if (!currentTab) return true;

    return currentTab.states.includes(delivery.status);
  });

  const handleRejectDelivery = async (id: string, message: string) => {
    setIsSubmitting(true);
    try {
      // Encontrar el delivery en la lista para obtener el projectId
      const delivery = deliveries.find(d => d.id === id);
      if (!delivery) {
        throw new Error('Delivery no encontrado');
      }

      const deliveryRef = doc(db, 'projects', delivery.projectId.toString(), 'deliveries', id);
      await updateDoc(deliveryRef, {
        status: 'client_rejected',
        reviewNotes: message,
        reviewedAt: new Date().toISOString()
      });
      
      toast({
        title: "Entrega rechazada",
        description: "La entrega ha sido rechazada correctamente",
      });
      
      setRejectDialogOpen(false);
      setSelectedDelivery(null);
    } catch (error) {
      console.error('Error al rechazar la entrega:', error);
      toast({
        title: "Error",
        description: "Hubo un error al rechazar la entrega.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveDelivery = async (id: string) => {
    setIsSubmitting(true);
    try {
      
      toast({
        title: "Entrega aprobada",
        description: "La entrega ha sido aprobada exitosamente.",
      });
      
      setApproveDialogOpen(false);
      setSelectedDelivery(null);
    } catch (error) {
      console.error('Error al aprobar la entrega:', error);
      toast({
        title: "Error",
        description: "Hubo un error al aprobar la entrega.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-8 px-4 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Entregas
          </h1>
        </div>

        <div className="mb-6">
          <div className="border-b">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const count = deliveries.filter(d => tab.states.includes(d.status)).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`
                      relative flex flex-col items-center pb-4 pt-2 px-1 
                      border-b-2 text-sm font-medium
                      ${selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.label}</span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                        {count}
                      </span>
                    </div>
                    <span className="mt-1 text-xs text-gray-500">{tab.description}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <DeliveryFilter
            projects={projects}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center items-center h-64 text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No hay entregas disponibles</p>
              </div>
            ) : (
              <ScrollArea className="h-[700px] pr-4 -mr-4">
                <div className="space-y-4">
                  {filteredDeliveries.map((delivery) => (
                    <Collapsible
                      key={delivery.id}
                      open={expandedDeliveries.has(delivery.id)}
                      onOpenChange={() => toggleExpanded(delivery.id)}
                    >
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:shadow-md">
                        <div className="p-6">
                          <div className="flex flex-col space-y-4">
                            {/* Header Section */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center space-x-3">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {delivery.milestone?.title ? 
                                      delivery.milestone.title : 
                                      'Entrega sin hito asignado'
                                    }
                                  </h3>
                                  <Badge className={`${getStatusColor(delivery.status)}`}>
                                    {getStatusText(delivery.status)}
                                  </Badge>
                                  {delivery.isInvoiced && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                      Facturado
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>{delivery.projectName}</span>
                                  {delivery.createdAt && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {format(
                                          isTimestamp(delivery.createdAt)
                                            ? new Date(delivery.createdAt.seconds * 1000)
                                            : new Date(delivery.createdAt), 
                                          "d 'de' MMMM, yyyy", 
                                          { locale: es }
                                        )}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDelivery(delivery);
                                    setRejectDialogOpen(true);
                                  }}
                                  className="text-gray-700 border-gray-200 hover:bg-gray-50"
                                >
                                  Rechazar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDelivery(delivery);
                                    setApproveDialogOpen(true);
                                  }}
                                  className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  Instalar en mi Servidor
                                </Button>
                                {delivery.testingUrl && (
                                  <a
                                    href={delivery.testingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                                  >
                                    <Link className="h-4 w-4" />
                                    <span className="text-sm">URL de pruebas</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Expand/Collapse Button */}
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost"
                                className="w-full justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">
                                    {expandedDeliveries.has(delivery.id) ? 'Ocultar detalles' : 'Ver detalles'}
                                  </span>
                                  {expandedDeliveries.has(delivery.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="border-t border-gray-200 bg-gray-50 p-6">
                            <div className="grid gap-6">
                              {/* Descripción */}
                              {delivery.description && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Descripción</h4>
                                  <p className="text-gray-600">{delivery.description}</p>
                                </div>
                              )}

                              {/* Tareas */}
                              {delivery.milestone?.backlogItems && delivery.milestone.backlogItems.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-3">Tareas completadas</h4>
                                  <div className="space-y-3">
                                    {delivery.milestone.backlogItems.map((item, index) => (
                                      <div key={item.id || index} className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                                        <CheckSquare className="h-5 w-5 text-emerald-500 mt-0.5" />
                                        <div>
                                          <p className="font-medium text-gray-900">{item.task}</p>
                                          {item.description && (
                                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Incidencias */}
                              {delivery.relatedIncidents && delivery.relatedIncidents.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-3">Incidencias relacionadas</h4>
                                  <div className="space-y-3">
                                    {delivery.relatedIncidents.map((incident) => (
                                      <div key={incident.id} className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                                        <div>
                                          <p className="font-medium text-gray-900">{incident.title}</p>
                                          {incident.description && (
                                            <p className="text-sm text-gray-500 mt-1">{incident.description}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Enlaces */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Enlaces y recursos</h4>
                                <div className="grid gap-4">
                                  {/* Video de Loom */}
                                  {delivery.loomUrl && (
                                    <div className="relative overflow-hidden rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 hover:border-purple-300 transition-all duration-200">
                                      <div className="space-y-3 p-4">
                                        <div className="relative pt-[56.25%] bg-black/5 rounded-lg overflow-hidden">
                                          <iframe
                                            src={delivery.loomUrl.replace('share', 'embed')}
                                            className="absolute inset-0 w-full h-full"
                                            frameBorder="0"
                                            allowFullScreen
                                          />
                                        </div>
                                        <div className="flex items-center space-x-3">
                                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
                                            <Video className="h-4 w-4" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-purple-900 truncate">
                                              Video explicativo
                                            </p>
                                            <p className="text-sm text-purple-600 truncate">
                                              {delivery.loomUrl}
                                            </p>
                                          </div>
                                          <a
                                            href={delivery.loomUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-400 hover:text-purple-600 transition-colors"
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* URL de pruebas */}
                                  {delivery.testingUrl && (
                                    <div className="relative overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 hover:border-blue-300 transition-all duration-200">
                                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/5"></div>
                                      <a
                                        href={delivery.testingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center p-4 space-x-3 relative z-10"
                                      >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                                          <Link className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-blue-900 truncate">
                                            URL de pruebas
                                          </p>
                                          <p className="text-sm text-blue-600 truncate">
                                            {delivery.testingUrl}
                                          </p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-blue-400" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        {selectedDelivery && (
          <>
            <RejectDeliveryDialog
              isOpen={rejectDialogOpen}
              onClose={() => {
                setRejectDialogOpen(false);
                setSelectedDelivery(null);
              }}
              onConfirm={(message) => handleRejectDelivery(selectedDelivery.id, message)}
              deliveryTitle={`${selectedDelivery.projectName} - ${selectedDelivery.milestone?.title || 'Sin hito'}`}
            />

            <ApproveDeliveryDialog
              isOpen={approveDialogOpen}
              onClose={() => {
                setApproveDialogOpen(false);
                setSelectedDelivery(null);
              }}
              delivery={selectedDelivery}
              tasks={selectedDelivery.milestone?.backlogItems?.map(item => ({
                id: item.id,
                task: item.task,
                description: item.description || undefined
              })) || []}
              incidents={selectedDelivery.relatedIncidents || []}
              onConfirm={() => handleApproveDelivery(selectedDelivery.id)}
              isInvoiced={selectedDelivery.isInvoiced || false}
              companyData={companyData || undefined}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
