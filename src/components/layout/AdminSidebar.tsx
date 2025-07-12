import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  Calendar, 
  Settings,
  Users,
  Info,
  User,
  Check,
  Eye
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Superadmin Overview',
    url: '/super-admin/superadmin-overview',
    icon: Info,
    group: 'Main'
  },
  {
    title: 'Superadmin Venues',
    url: '/super-admin/superadmin-venues',
    icon: Calendar,
    group: 'Management'
  },
  {
    title: 'Superadmin Users',
    url: '/super-admin/superadmin-users',
    icon: Users,
    group: 'Management'
  },
  {
    title: 'Superadmin Payments',
    url: '/super-admin/superadmin-payments',
    icon: Check,
    group: 'Finance'
  },
  {
    title: 'Superadmin Reports',
    url: '/super-admin/superadmin-reports',
    icon: Eye,
    group: 'Finance'
  },
  {
    title: 'Superadmin Admins',
    url: '/super-admin/superadmin-admins',
    icon: User,
    group: 'System'
  },
  {
    title: 'Superadmin Activity',
    url: '/super-admin/superadmin-activity',
    icon: Eye,
    group: 'System'
  },
  {
    title: 'Superadmin Settings',
    url: '/super-admin/superadmin-settings',
    icon: Settings,
    group: 'System'
  }
];

const groupedItems = navigationItems.reduce((acc, item) => {
  if (!acc[item.group]) acc[item.group] = [];
  acc[item.group].push(item);
  return acc;
}, {} as Record<string, typeof navigationItems>);

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? 'w-[72px]' : 'w-64'} collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">VF</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-foreground">VenueFinder</h2>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup key={groupName}>
            {!collapsed && <SidebarGroupLabel>{groupName}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive: navIsActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                            isActive(item.url) || navIsActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}