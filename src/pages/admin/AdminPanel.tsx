import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { Shield, Users, Building2, CheckCircle, XCircle, Loader2, UserCheck, BarChart3, FileText, CreditCard, Activity } from 'lucide-react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import { useImpersonationStore } from '@/stores/impersonation.store';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';
import { useNavigate, Routes, Route, useSearchParams } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';
import type { User } from '@/types/auth.types';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  isActive: boolean;
  phoneNumber?: string;
}

interface Tenant {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  subscription: {
    plan: string;
    status: string;
  };
}

const AdminPanel = () => {
  const { currentUser } = useAuthStore();
  const { startImpersonation } = useImpersonationStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Get active tab from URL, default to 'dashboard'
  const activeTab = (searchParams.get('tab') || 'dashboard') as 'dashboard' | 'users' | 'tenants' | 'reports' | 'revenue' | 'performance';
  
  // Get pagination and filter params
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Check if user is super_admin
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Update URL when changing tabs
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    // Reset pagination when changing tabs
    params.delete('page');
    params.delete('search');
    params.delete('status');
    setSearchParams(params);
  };

  // Update URL parameters
  const updateURLParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'tenants') {
      fetchTenants();
    }
  }, [activeTab, page, search, status, sortBy, sortOrder]);


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersQuery = query(
        collection(firestore, COLLECTION_NAMES.USERS),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load users', 'Unable to fetch user data');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const tenantsQuery = query(
        collection(firestore, 'tenants'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tenantsQuery);
      const tenantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tenant));
      setTenants(tenantsData);
    } catch (error) {
      toast.error('Failed to load tenants', 'Unable to fetch tenant data');
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(firestore, COLLECTION_NAMES.USERS, userId), {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ));
      
      toast.success(
        'User updated',
        `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      toast.error('Update failed', 'Unable to update user status');
      console.error('Error updating user:', error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
    setUpdating(tenantId);
    try {
      await updateDoc(doc(firestore, 'tenants', tenantId), {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      setTenants(tenants.map(tenant => 
        tenant.id === tenantId ? { ...tenant, isActive: !currentStatus } : tenant
      ));
      
      toast.success(
        'Tenant updated',
        `Tenant ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      toast.error('Update failed', 'Unable to update tenant status');
      console.error('Error updating tenant:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleImpersonateUser = (user: AdminUser) => {
    if (!currentUser || user.role === 'super_admin') {
      toast.error('Cannot impersonate', 'You cannot impersonate another super admin');
      return;
    }

    const impersonatedUser: User = {
      id: user.id,
      uid: user.id,
      email: user.email,
      displayName: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as any,
      tenantId: user.tenantId || '',
      isActive: user.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [],
      isEmailVerified: true,
      phoneNumber: user.phoneNumber
    };

    startImpersonation(impersonatedUser, currentUser);
    toast.success('Impersonation started', `Now impersonating ${user.email}`);
    navigate('/dashboard');
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need super admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users and tenants across the system
            </p>
          </div>
          <Link
            to="/demo/voice-dictation"
            className="btn btn-outline flex items-center gap-2"
          >
            <MicrophoneIcon className="h-4 w-4" />
            Voice Dictation Demo
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <BarChart3 className="h-5 w-5 inline-block mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Users className="h-5 w-5 inline-block mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'tenants'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Building2 className="h-5 w-5 inline-block mr-2" />
            Tenants
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FileText className="h-5 w-5 inline-block mr-2" />
            Reports
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'revenue'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <CreditCard className="h-5 w-5 inline-block mr-2" />
            Revenue
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'performance'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Activity className="h-5 w-5 inline-block mr-2" />
            Performance
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'dashboard' ? (
        <AdminDashboard />
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => updateURLParams({ search: e.target.value, page: '1' })}
                  className="input w-full"
                />
              </div>
              <select
                value={status}
                onChange={(e) => updateURLParams({ status: e.target.value, page: '1' })}
                className="input w-full md:w-auto"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  updateURLParams({ sortBy: field, sortOrder: order, page: '1' });
                }}
                className="input w-full md:w-auto"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
                <option value="firstName-asc">Name A-Z</option>
                <option value="firstName-desc">Name Z-A</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.tenantId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        disabled={updating === user.id || user.id === currentUser?.id}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {updating === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isActive ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                      {user.role !== 'super_admin' && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleImpersonateUser(user)}
                          disabled={!user.isActive}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Impersonate User"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : activeTab === 'tenants' ? (
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search tenants by name or code..."
                  value={search}
                  onChange={(e) => updateURLParams({ search: e.target.value, page: '1' })}
                  className="input w-full"
                />
              </div>
              <select
                value={status}
                onChange={(e) => updateURLParams({ status: e.target.value, page: '1' })}
                className="input w-full md:w-auto"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  updateURLParams({ sortBy: field, sortOrder: order, page: '1' });
                }}
                className="input w-full md:w-auto"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="code-asc">Code A-Z</option>
                <option value="code-desc">Code Z-A</option>
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tenant.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {tenant.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {tenant.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {tenant.subscription?.plan || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tenant.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleTenantStatus(tenant.id, tenant.isActive)}
                      disabled={updating === tenant.id}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating === tenant.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : tenant.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : activeTab === 'reports' ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              System Reports
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Generate and view comprehensive reports across all tenants
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <button className="btn btn-outline">
                <FileText className="h-4 w-4 mr-2" />
                User Activity Report
              </button>
              <button className="btn btn-outline">
                <FileText className="h-4 w-4 mr-2" />
                Test Volume Report
              </button>
              <button className="btn btn-outline">
                <FileText className="h-4 w-4 mr-2" />
                Revenue Summary
              </button>
              <button className="btn btn-outline">
                <FileText className="h-4 w-4 mr-2" />
                Patient Demographics
              </button>
              <button className="btn btn-outline">
                <FileText className="h-4 w-4 mr-2" />
                Lab Performance
              </button>
              <button className="btn btn-outline">
                <FileText className="h-4 w-4 mr-2" />
                Compliance Report
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'revenue' ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg p-6">
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Revenue Management
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Track revenue, subscriptions, and billing across all tenants
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-2">💰</div>
                <h4 className="font-medium text-gray-900 dark:text-white">Total Revenue</h4>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-2">
                  $0.00
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All time</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="font-medium text-gray-900 dark:text-white">Monthly Revenue</h4>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">
                  $0.00
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current month</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-2">🔄</div>
                <h4 className="font-medium text-gray-900 dark:text-white">Active Subscriptions</h4>
                <p className="text-2xl font-bold text-info-600 dark:text-info-400 mt-2">
                  0
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recurring revenue</p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'performance' ? (
        <PerformanceDashboard />
      ) : null}
    </div>
  );
};

export default AdminPanel;