import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, UserPlus, Shield, Search } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAuthStore } from '@/stores/auth.store';
import { UserListTable } from '@/components/users/UserListTable';
import { UserForm } from '@/components/users/UserForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { userService } from '@/services/users/userService';
import { toast } from 'sonner';
import type { User } from '@/types/auth.types';
import type { UserFormData, UserFilter } from '@/types/user-management.types';

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuthStore();
  const [filters, setFilters] = useState<UserFilter>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading } = useUsers(filters.role);

  // Check if user has permission to manage users
  const canManageUsers = currentUser?.role === 'lab_admin' || 
                        currentUser?.role === 'super_admin' ||
                        currentUser?.permissions?.includes('users.manage');

  // Handle URL query parameters
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new' && canManageUsers) {
      setShowAddForm(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, canManageUsers]);

  const handleAddUser = async (data: UserFormData) => {
    try {
      await userService.createUser(data);
      toast.success('User Created', {
        description: `${data.displayName} has been added successfully`
      });
      setShowAddForm(false);
      // Refresh the users list
      window.location.reload();
    } catch (error: any) {
      toast.error('Failed to Create User', {
        description: error.message || 'An error occurred while creating the user'
      });
    }
  };

  const handleEditUser = async (data: UserFormData) => {
    if (editingUser) {
      try {
        await userService.updateUser(editingUser.id, data);
        toast.success('User Updated', {
          description: `${data.displayName} has been updated successfully`
        });
        setEditingUser(null);
        // Refresh the users list
        window.location.reload();
      } catch (error: any) {
        toast.error('Failed to Update User', {
          description: error.message || 'An error occurred while updating the user'
        });
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      try {
        await userService.deleteUser(user.id);
        toast.success('User Deleted', {
          description: `${user.displayName} has been removed`
        });
        // Refresh the users list
        window.location.reload();
      } catch (error: any) {
        toast.error('Failed to Delete User', {
          description: error.message || 'An error occurred while deleting the user'
        });
      }
    }
  };

  const handleViewUser = (user: User) => {
    navigate(`/users/${user.id}`);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.toggleUserStatus(user.id, !user.isActive);
      toast.success(
        user.isActive ? 'User Deactivated' : 'User Activated',
        {
          description: `${user.displayName} has been ${user.isActive ? 'deactivated' : 'activated'}`
        }
      );
      // Refresh the users list
      window.location.reload();
    } catch (error: any) {
      toast.error('Failed to Toggle Status', {
        description: error.message || 'An error occurred while updating user status'
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      (user.metadata?.employeeId?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to manage users.
          </p>
        </div>
      </div>
    );
  }

  if (showAddForm || editingUser) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {editingUser ? 'Update user information' : 'Create a new user account'}
          </p>
        </div>

        <UserForm
          initialData={editingUser || undefined}
          onSubmit={editingUser ? handleEditUser : handleAddUser}
          onCancel={() => {
            setShowAddForm(false);
            setEditingUser(null);
          }}
          isLoading={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.role || ''}
              onChange={(e) => setFilters({ ...filters, role: (e.target.value || undefined) as any })}
              className="input"
            >
              <option value="">All Roles</option>
              <option value="lab_admin">Lab Admin</option>
              <option value="lab_manager">Lab Manager</option>
              <option value="lab_technician">Lab Technician</option>
              <option value="phlebotomist">Phlebotomist</option>
              <option value="receptionist">Receptionist</option>
              <option value="billing_staff">Billing Staff</option>
              <option value="clinician">Clinician</option>
              <option value="viewer">Viewer</option>
            </select>
            <select
              value={filters.isActive === undefined ? 'all' : filters.isActive ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({ 
                  ...filters, 
                  isActive: value === 'all' ? undefined : value === 'active'
                });
              }}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No users found matching your search.' : 'No users found. Add your first user to get started.'}
          </p>
        </div>
      ) : (
        <UserListTable
          users={filteredUsers}
          onEdit={setEditingUser}
          onDelete={handleDeleteUser}
          onView={handleViewUser}
          onToggleStatus={handleToggleStatus}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
};

export default UsersPage;