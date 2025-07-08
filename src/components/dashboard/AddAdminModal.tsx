import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield } from 'lucide-react';
import type { Admin, AdminPermission, UserRole } from '@/types/dashboard';

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (adminData: Omit<Admin, 'id' | 'createdAt' | 'lastLoginAt'>) => void;
}

const RESOURCES = [
  { id: 'venues', label: 'Venues', description: 'Manage venue listings and approvals' },
  { id: 'users', label: 'Users', description: 'Manage registered users' },
  { id: 'payments', label: 'Payments', description: 'Handle transactions and payouts' },
  { id: 'admins', label: 'Admins', description: 'Manage administrators (Super Admin only)' },
  { id: 'reports', label: 'Reports', description: 'Access analytics and reports' }
] as const;

const ACTIONS = [
  { id: 'view', label: 'View', description: 'Read access' },
  { id: 'create', label: 'Create', description: 'Add new items' },
  { id: 'update', label: 'Update', description: 'Edit existing items' },
  { id: 'delete', label: 'Delete', description: 'Remove items' }
] as const;

export function AddAdminModal({ isOpen, onClose, onAdd }: AddAdminModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sub_admin' as UserRole
  });
  
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
    
    // Set default permissions based on role
    if (role === 'super_admin') {
      setPermissions(
        RESOURCES.map(resource => ({
          resource: resource.id as AdminPermission['resource'],
          actions: ACTIONS.map(action => action.id as AdminPermission['actions'][0])
        }))
      );
    } else {
      // Sub-admin gets view-only by default
      setPermissions(
        RESOURCES.filter(r => r.id !== 'admins').map(resource => ({
          resource: resource.id as AdminPermission['resource'],
          actions: ['view']
        }))
      );
    }
  };

  const handlePermissionChange = (
    resourceId: string, 
    actionId: string, 
    checked: boolean
  ) => {
    setPermissions(prev => {
      const existingResource = prev.find(p => p.resource === resourceId);
      
      if (!existingResource) {
        if (checked) {
          return [...prev, { 
            resource: resourceId as AdminPermission['resource'], 
            actions: [actionId as AdminPermission['actions'][0]] 
          }];
        }
        return prev;
      }

      const updatedActions = checked
        ? [...existingResource.actions, actionId as AdminPermission['actions'][0]]
        : existingResource.actions.filter(a => a !== actionId);

      if (updatedActions.length === 0) {
        return prev.filter(p => p.resource !== resourceId);
      }

      return prev.map(p => 
        p.resource === resourceId 
          ? { ...p, actions: updatedActions }
          : p
      );
    });
  };

  const isActionChecked = (resourceId: string, actionId: string) => {
    const resource = permissions.find(p => p.resource === resourceId);
    return resource?.actions.includes(actionId as AdminPermission['actions'][0]) || false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    onAdd({
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      permissions
    });

    // Reset form
    setFormData({ name: '', email: '', role: 'sub_admin' });
    setPermissions([]);
  };

  const filteredResources = formData.role === 'sub_admin' 
    ? RESOURCES.filter(r => r.id !== 'admins')
    : RESOURCES;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Administrator
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Full Name *</Label>
                  <Input
                    id="admin-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email Address *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-role">Role *</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Super Admin</div>
                          <div className="text-xs text-muted-foreground">Full system access</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="sub_admin">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Sub Admin</div>
                          <div className="text-xs text-muted-foreground">Limited access</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissions
                <Badge variant="secondary" className="ml-2">
                  {formData.role === 'super_admin' ? 'Full Access' : 'Customizable'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredResources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">{resource.label}</h4>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {ACTIONS.map((action) => (
                        <div key={action.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${resource.id}-${action.id}`}
                            checked={isActionChecked(resource.id, action.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(resource.id, action.id, checked as boolean)
                            }
                            disabled={formData.role === 'super_admin'}
                          />
                          <Label 
                            htmlFor={`${resource.id}-${action.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {action.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/80"
              disabled={!formData.name.trim() || !formData.email.trim()}
            >
              <User className="mr-2 h-4 w-4" />
              Add Administrator
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}