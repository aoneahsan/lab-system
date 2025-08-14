/**
 * Permission Management Page
 * Allows admins to manage user permissions and roles
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Alert, AlertDescription } from '@/components/ui/Alert';
// Separator removed - not available
import { 
  Search, 
  Shield, 
  Users, 
  Key, 
  Lock, 
  Unlock,
  Save,
  RefreshCw,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS, PERMISSION_CATEGORIES, PERMISSION_DESCRIPTIONS, Permission } from '@/constants/permissions.constants';
import { ROLE_PERMISSIONS, getRolePermissions } from '@/constants/role-permissions.constants';
import { SYSTEM_ROLES } from '@/constants/tenant.constants';
import { formatPermissionName } from '@/utils/permission.utils';
import { User, UserRole } from '@/types/auth.types';
import { toast } from 'react-hot-toast';

export const PermissionManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { currentUser } = useAuthStore();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());
  const [showOnlyCustom, setShowOnlyCustom] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Fetch all users
  const { data: users = [], isLoading: loadingUsers } = useQuery(
    ['users', currentUser?.tenantId],
    async () => {
      if (!currentUser?.tenantId) return [];
      const snapshot = await getDocs(collection(firestore, COLLECTION_NAMES.USERS));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    },
    {
      enabled: hasPermission(PERMISSIONS.USERS_MANAGE_PERMISSIONS)
    }
  );
  
  // Update user role mutation
  const updateRoleMutation = useMutation(
    async ({ userId, role }: { userId: string; role: UserRole }) => {
      await updateDoc(doc(firestore, COLLECTION_NAMES.USERS, userId), {
        role,
        updatedAt: serverTimestamp()
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('User role updated successfully');
      },
      onError: () => {
        toast.error('Failed to update user role');
      }
    }
  );
  
  // Update user permissions mutation
  const updatePermissionsMutation = useMutation(
    async ({ userId, permissions }: { userId: string; permissions: Permission[] }) => {
      await updateDoc(doc(firestore, COLLECTION_NAMES.USERS, userId), {
        permissions,
        updatedAt: serverTimestamp()
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('User permissions updated successfully');
      },
      onError: () => {
        toast.error('Failed to update user permissions');
      }
    }
  );
  
  // Initialize selected permissions when user is selected
  useEffect(() => {
    if (selectedUser) {
      const userPermissions = new Set<Permission>(selectedUser.permissions || []);
      setSelectedPermissions(userPermissions);
      setSelectedRole(selectedUser.role as UserRole);
    }
  }, [selectedUser]);
  
  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get permissions for display
  const getDisplayPermissions = () => {
    let permissions: Permission[] = [];
    
    if (selectedRole) {
      permissions = getRolePermissions(selectedRole);
    }
    
    if (showOnlyCustom && selectedUser) {
      return selectedUser.permissions || [];
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      permissions = PERMISSION_CATEGORIES[selectedCategory] || [];
    } else if (!selectedRole) {
      permissions = Object.values(PERMISSIONS);
    }
    
    if (permissionSearch) {
      permissions = permissions.filter(p => 
        p.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        PERMISSION_DESCRIPTIONS[p]?.toLowerCase().includes(permissionSearch.toLowerCase())
      );
    }
    
    return permissions;
  };
  
  const displayPermissions = getDisplayPermissions();
  
  // Check if permission is from role or custom
  const isRolePermission = (permission: Permission): boolean => {
    if (!selectedRole) return false;
    return getRolePermissions(selectedRole).includes(permission);
  };
  
  // Handle permission toggle
  const handlePermissionToggle = (permission: Permission) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setSelectedPermissions(newPermissions);
  };
  
  // Handle save permissions
  const handleSavePermissions = () => {
    if (!selectedUser) return;
    
    // Get only custom permissions (not from role)
    const rolePermissions = selectedRole ? getRolePermissions(selectedRole) : [];
    const customPermissions = Array.from(selectedPermissions).filter(
      p => !rolePermissions.includes(p)
    );
    
    updatePermissionsMutation.mutate({
      userId: selectedUser.id,
      permissions: customPermissions
    });
  };
  
  // Handle role change
  const handleRoleChange = (newRole: UserRole) => {
    if (!selectedUser) return;
    
    setSelectedRole(newRole);
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole
    });
  };
  
  // Export permissions configuration
  const handleExportPermissions = () => {
    const config = {
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        permissions: u.permissions
      })),
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.email
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions-backup-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <PermissionGate 
      permission={PERMISSIONS.USERS_MANAGE_PERMISSIONS}
      unauthorizedMessage="You don't have permission to manage user permissions"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Permission Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage user roles and permissions across the system
            </p>
          </div>
          <Button onClick={handleExportPermissions} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users
              </CardTitle>
              <CardDescription>
                Select a user to manage permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* User List */}
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {loadingUsers ? (
                      <div className="text-center py-4">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-4">
                        <Users className="h-12 w-12 text-gray-300 mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">No users found</p>
                      </div>
                    ) : (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedUser?.id === user.id
                              ? 'bg-blue-50 border-blue-300'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.displayName || user.email}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={user.role === 'super_admin' ? 'destructive' : 'secondary'}>
                                {user.role}
                              </Badge>
                              {user.permissions && user.permissions.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.permissions.length} custom
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
          
          {/* Permission Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Permissions
              </CardTitle>
              <CardDescription>
                {selectedUser 
                  ? `Managing permissions for ${selectedUser.displayName || selectedUser.email}`
                  : 'Select a user to manage permissions'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <Tabs defaultValue="permissions" className="space-y-4">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="role">Role & Info</TabsTrigger>
                  </TabsList>
                  
                  {/* Permissions Tab */}
                  <TabsContent value="permissions" className="space-y-4">
                    {/* Controls */}
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search permissions..."
                            value={permissionSearch}
                            onChange={(e) => setPermissionSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {Object.keys(PERMISSION_CATEGORIES).map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={showOnlyCustom}
                          onCheckedChange={setShowOnlyCustom}
                        />
                        <Label>Custom only</Label>
                      </div>
                    </div>
                    
                    {/* Permission List */}
                    <ScrollArea className="h-[400px] border rounded-lg p-4">
                      <div className="space-y-2">
                        {displayPermissions.length === 0 ? (
                          <div className="text-center py-8">
                            <Lock className="h-12 w-12 text-gray-300 mx-auto" />
                            <p className="text-sm text-gray-500 mt-2">
                              No permissions to display
                            </p>
                          </div>
                        ) : (
                          displayPermissions.map(permission => {
                            const isFromRole = isRolePermission(permission);
                            const isChecked = isFromRole || selectedPermissions.has(permission);
                            
                            return (
                              <div
                                key={permission}
                                className="flex items-start space-x-3 py-2 px-3 rounded hover:bg-gray-50"
                              >
                                <Checkbox
                                  checked={isChecked}
                                  disabled={isFromRole}
                                  onCheckedChange={() => handlePermissionToggle(permission)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Label className="font-medium cursor-pointer">
                                      {formatPermissionName(permission)}
                                    </Label>
                                    {isFromRole && (
                                      <Badge variant="outline" className="text-xs">
                                        From role
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {PERMISSION_DESCRIPTIONS[permission]}
                                  </p>
                                  <p className="text-xs text-gray-400 font-mono mt-1">
                                    {permission}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                    
                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {selectedRole && (
                          <span>
                            Role permissions: {getRolePermissions(selectedRole).length} | 
                            Custom: {Array.from(selectedPermissions).filter(p => !isRolePermission(p)).length}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedPermissions(new Set());
                          }}
                        >
                          Clear Custom
                        </Button>
                        <Button
                          onClick={handleSavePermissions}
                          disabled={updatePermissionsMutation.isLoading}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Permissions
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Role Tab */}
                  <TabsContent value="role" className="space-y-4">
                    <div className="space-y-4">
                      {/* Role Selection */}
                      <div>
                        <Label>User Role</Label>
                        <Select 
                          value={selectedRole} 
                          onValueChange={(value) => handleRoleChange(value as UserRole)}
                          disabled={selectedUser.role === 'super_admin'}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SYSTEM_ROLES).map(([key, value]) => (
                              <SelectItem key={value} value={value}>
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedUser.role === 'super_admin' && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Super admin role cannot be changed
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <hr className="my-4 border-gray-200" />
                      <div className="space-y-3">
                        <h3 className="font-medium">User Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-medium">{selectedUser.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Display Name</p>
                            <p className="font-medium">{selectedUser.displayName || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Status</p>
                            <Badge variant={selectedUser.isActive ? 'success' : 'destructive'}>
                              {selectedUser.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-gray-500">Tenant</p>
                            <p className="font-medium">{selectedUser.tenantId || 'Not assigned'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Created</p>
                            <p className="font-medium">
                              {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Last Login</p>
                            <p className="font-medium">
                              {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Role Permissions Summary */}
                      <hr className="my-4 border-gray-200" />
                      <div className="space-y-3">
                        <h3 className="font-medium">Role Permissions Summary</h3>
                        <div className="text-sm space-y-2">
                          {selectedRole && Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
                            const rolePerms = getRolePermissions(selectedRole);
                            const categoryPerms = permissions.filter(p => rolePerms.includes(p));
                            
                            if (categoryPerms.length === 0) return null;
                            
                            return (
                              <div key={category} className="flex items-center justify-between py-1">
                                <span className="text-gray-600">{category}</span>
                                <Badge variant="outline">
                                  {categoryPerms.length}/{permissions.length}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-16">
                  <UserCheck className="h-16 w-16 text-gray-300 mx-auto" />
                  <p className="text-gray-500 mt-4">
                    Select a user from the list to manage permissions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
};