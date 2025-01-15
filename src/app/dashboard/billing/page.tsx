'use client';

import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import DashboardLayout from '@/components/dashboard/layout';
import { BillingSection } from '@/components/dashboard/billing/BillingSection';

export default function BillingPage() {
  const { user } = useAuth();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Facturación</h1>
        </div>
        <BillingSection 
          invoices={projects?.flatMap(p => p.invoices) ?? []}
          loading={projectsLoading}
          error={projectsError}
        />
      </div>
    </DashboardLayout>
  );
}
