'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppUser } from "@/types";

interface PersonalInfoTabProps {
  user: AppUser | null;
}

export function PersonalInfoTab({ user }: PersonalInfoTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>Gestiona tu información personal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium leading-none">Nombre</label>
          <Input value={user?.name || ''} disabled className="mt-2" />
        </div>
        <div>
          <label className="text-sm font-medium leading-none">Email</label>
          <Input value={user?.email || ''} disabled className="mt-2" />
        </div>
        <div>
          <label className="text-sm font-medium leading-none">Teléfono</label>
          <Input value={user?.contact || ''} disabled className="mt-2" />
        </div>
      </CardContent>
    </Card>
  );
}
