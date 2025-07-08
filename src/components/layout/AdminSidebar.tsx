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
    title: 'Overview',
    url: '/super-admin/',
    icon: Info,
    group: 'Main'
  },
  {
    title: 'Venues',
    url: '/super-admin/venues',
    icon: Calendar,
    group: 'Management'
  },
  {
    title: 'Users',
    url: '/super-admin/users',
    icon: Users,
    group: 'Management'
  },
  {
    title: 'Payments',
    url: '/super-admin/payments',
    icon: Check,
    group: 'Finance'
  },
  {
    title: 'Reports',
    url: '/super-admin/reports',
    icon: Eye,
    group: 'Finance'
  },
  {
    title: 'Admins',
    url: '/super-admin/admins',
    icon: User,
    group: 'System'
  },
  {
    title: 'Activity',
    url: '/super-admin/activity',
    icon: Eye,
    group: 'System'
  },
  {
    title: 'Settings',
    url: '/super-admin/settings',
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