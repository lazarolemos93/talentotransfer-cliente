import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Project, Milestone, BacklogItem, Delivery, Ticket, Incident, Invoice } from '@/types/Project';

const getProjectStatus = (backlog: BacklogItem[] = []): 'active' | 'completed' | 'pending' => {
  if (!backlog.length) return 'pending';
  
  const completedTasks = backlog.filter(item => item.estado === 'Finalizado').length;
  const totalTasks = backlog.length;
  
  if (completedTasks === totalTasks) return 'completed';
  if (completedTasks === 0) return 'pending';
  return 'active';
};

const getMilestoneProgress = (milestone: Milestone, backlog: BacklogItem[]) => {
  const milestoneBacklogItems = backlog.filter(item => item.milestone_id === milestone.id);
  if (!milestoneBacklogItems.length) return 0;
  
  const completedStates = ['Finalizado', 'Revisión por el cliente', 'Revisión'];
  const completed = milestoneBacklogItems.filter(item => 
    completedStates.includes(item.estado)
  ).length;
  return Math.round((completed / milestoneBacklogItems.length) * 100);
};

const processMilestone = (milestone: Milestone, backlog: BacklogItem[]) => {
  const milestoneBacklogItems = backlog.filter(item => item.milestone_id === milestone.id);
  const progress = getMilestoneProgress(milestone, backlog);
  
  return {
    ...milestone,
    backlogItems: milestoneBacklogItems,
    progress,
    totalTasks: milestoneBacklogItems.length
  };
};

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, company_id } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user || !company_id) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Obtener proyectos
        console.log('Intentando obtener proyectos para company_id:', company_id);
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('company_id', '==', company_id));
        let querySnapshot;
        try {
          querySnapshot = await getDocs(q);
          console.log('Proyectos obtenidos:', querySnapshot.size);
        } catch (err) {
          console.error('Error al obtener proyectos:', err);
          throw new Error('Error al obtener la lista de proyectos');
        }
        
        // Obtener las facturas relacionadas con los proyectos de la compañía

        const projectIds = querySnapshot.docs.map(doc => doc.id);
        console.log("projectIds ", projectIds);
        
        const invoicesRef = collection(db, 'invoices');
        const invoicesQuery = query(invoicesRef, where('projectId', 'in', projectIds));
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const allInvoices = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[];

        // Fetch all projects with their subcollections
        const projectsData = await Promise.all(
          querySnapshot.docs.map(async (projectDoc) => {
            const projectData = projectDoc.data();
            console.log('Procesando proyecto:', projectDoc.id, projectData.company_id);
            
            try {
              // 2. Obtener milestones
              console.log('Intentando obtener milestones para proyecto:', projectDoc.id);
              const milestonesRef = collection(projectDoc.ref, 'milestones');
              const milestonesSnapshot = await getDocs(milestonesRef);
              const milestones = milestonesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Milestone[];
              console.log('Milestones obtenidos:', milestones.length);

              // 3. Obtener backlog items
              console.log('Intentando obtener backlog items para proyecto:', projectDoc.id);
              const backlogRef = collection(projectDoc.ref, 'backlog');
              const backlogSnapshot = await getDocs(backlogRef);
              const backlog = backlogSnapshot.docs.map(doc => ({
                id: doc.id,
                project_id: projectDoc.id,
                ...doc.data()
              })) as BacklogItem[];
              console.log('Backlog items obtenidos:', backlog.length);

              // 4. Obtener tickets
              console.log('Intentando obtener tickets para proyecto:', projectDoc.id);
              const ticketsRef = collection(projectDoc.ref, 'tickets');
              const ticketsSnapshot = await getDocs(ticketsRef);
              const tickets = ticketsSnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                description: doc.data().description,
                status: doc.data().status,
                clientVisible: doc.data().clientVisible,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt,
                assignedTo: doc.data().assignedTo,
                priority: doc.data().priority
              })) as Ticket[];
              console.log('Tickets obtenidos:', tickets.length);

              // 5. Obtener deliveries
              console.log('Intentando obtener deliveries para proyecto:', projectDoc.id);
              const deliveriesRef = collection(projectDoc.ref, 'deliveries');
              const deliveriesSnapshot = await getDocs(deliveriesRef);
              const deliveries = deliveriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Delivery[];
              console.log('Deliveries obtenidos:', deliveries.length);
              console.log('Delivery statuses:', deliveries.map(d => d.status));

              // 6. Obtener incidents
              console.log('Intentando obtener incidents para proyecto:', projectDoc.id);
              const incidentsRef = collection(projectDoc.ref, 'incidents');
              const incidentsSnapshot = await getDocs(incidentsRef);
              const incidents = incidentsSnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                description: doc.data().description,
                status: doc.data().status,
                priority: doc.data().priority,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt,
                assignedTo: doc.data().assignedTo,
                reportedBy: doc.data().reportedBy
              })) as Incident[];
              console.log('Incidents obtenidos:', incidents.length);

              // Procesar milestones con sus tareas asociadas
              const processedMilestones = milestones.map(milestone => 
                processMilestone(milestone, backlog)
              );

              // Calcular estado del proyecto
              const projectStatus = getProjectStatus(backlog);

              // Calculate progress based on milestones
              const progress = processedMilestones.reduce((acc, milestone) => 
                acc + milestone.progress, 0) / (processedMilestones.length || 1);

              const projectTickets: Ticket[] = tickets || [];
              const projectIncidents: Incident[] = incidents || [];
              const projectDeliveries: Delivery[] = deliveries || [];

              console.log("deliveries ", projectDeliveries);
              const projectInvoices = allInvoices.filter(invoice => invoice.projectId === projectDoc.id);

              const project: Project = {
                id: projectDoc.id,
                name: projectData.name,
                opportunity_id: projectData.opportunity_id,
                progress,
                status: projectStatus,
                milestones: processedMilestones,
                backlog,
                tickets: projectTickets,
                incidents: projectIncidents,
                deliveries: projectDeliveries,
                visible: projectData.visible,
                ppc: projectData.ppc,
                ppp: projectData.ppp,
                client: projectData.client,
                description: projectData.description,
                pendingDeliveries: projectDeliveries.filter(delivery => 
                  delivery.status === 'approved'
                ).length,
                pendingTickets: projectTickets.filter(ticket => 
                  ticket.clientVisible && ticket.status !== 'closed'
                ).length,
                pendingIncidents: projectIncidents.filter((incident: Incident) => 
                  incident.status === 'approved'
                ).length,
                notes: projectData.notes || [],
                documents: projectData.documents || [],
                meetings: projectData.meetings || [],
                invoices: projectInvoices,
              };

              return project;
            } catch (err) {
              console.error('Error al procesar proyecto', projectDoc.id, ':', err);
              return {
                id: projectDoc.id,
                name: 'Error',
                opportunity_id: '',
                progress: 0,
                status: 'pending',
                milestones: [],
                backlog: [],
                tickets: [],
                incidents: [],
                deliveries: [],
                visible: 0,
                ppc: 0,
                ppp: 0,
                client: '',
                description: '',
                pendingDeliveries: 0,
                pendingTickets: 0,
                pendingIncidents: 0,
                notes: [],
                documents: [],
                meetings: [],
                invoices: [],
              } as Project;
            }
          })
        );

        setProjects(projectsData);
      } catch (error) {
        console.error('Error en fetchProjects:', error);
        setError('Error al cargar los proyectos');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, company_id]);

  return { projects, loading, error };
};
