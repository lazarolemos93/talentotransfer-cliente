'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Inbox,
  AlertCircle,
  TicketIcon,
  LogOut,
  Receipt,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CompanySelector from '@/components/CompanySelector';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Proyectos',
    href: '/dashboard/projects',
    icon: FolderKanban,
  },
  {
    name: 'Entregas',
    href: '/dashboard/deliveries',
    icon: Inbox,
  },
  {
    name: 'Incidencias',
    href: '/dashboard/incidents',
    icon: AlertCircle,
  },
  {
    name: 'Tickets',
    href: '/dashboard/tickets',
    icon: TicketIcon,
  },
  {
    name: 'Facturación',
    href: '/dashboard/billing',
    icon: Receipt,
  },
  {
    name: 'Perfil',
    href: '/dashboard/profile',
    icon: User,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="fixed z-30 flex h-screen w-64 flex-col border-r bg-background">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-bold">Client Dashboard</span>
        </Link>
        <CompanySelector />
      </div>
      <ScrollArea className="flex-1 overflow-hidden">
        <nav className="grid items-start gap-2 py-4 px-3">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2',
                  pathname === item.href ? 'bg-secondary' : 'hover:bg-secondary/50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
