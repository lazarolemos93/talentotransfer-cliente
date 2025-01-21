'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { PersonalInfoTab, SecurityTab, CompaniesTab } from "../../../components/dashboard/profile";
import DashboardLayout from "@/components/dashboard/layout";

export default function ProfilePage() {
  const { user, companies } = useAuth();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Información Personal</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
          </TabsList>

          {/* Información Personal */}
          <TabsContent value="personal">
            <PersonalInfoTab user={user} />
          </TabsContent>

          {/* Seguridad */}
          <TabsContent value="security">
            <SecurityTab user={user} />
          </TabsContent>

          {/* Empresas */}
          <TabsContent value="companies">
            <CompaniesTab user={user} companies={companies} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}