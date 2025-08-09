import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-utils';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalPatients: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

interface TenantSummary {
  id: string;
  name: string;
  code: string;
  userCount: number;
  patientCount: number;
  testCount: number;
  revenue: number;
  lastActivity: Date;
  subscriptionStatus: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get period from URL or default to 'month'
  const selectedPeriod = (searchParams.get('period') || 'month') as 'today' | 'week' | 'month' | 'year';
  
  // Get pagination params
  const currentPage = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const sortBy = searchParams.get('sortBy') || 'revenue';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  
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
  
  // Update URL when period changes
  const setSelectedPeriod = (period: 'today' | 'week' | 'month' | 'year') => {
    updateURLParams({ period });
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats', selectedPeriod],
    queryFn: async () => {
      const tenantsSnapshot = await getDocs(collection(firestore, 'tenants'));
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      
      let totalPatients = 0;
      let totalRevenue = 0;
      let activeTenants = 0;
      let activeSubscriptions = 0;

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenant = tenantDoc.data();
        if (tenant.isActive) {
          activeTenants++;
          if (tenant.subscription?.status === 'active') {
            activeSubscriptions++;
          }
        }

        // Get patient count for this tenant
        const patientsQuery = query(
          collection(firestore, `labflow_${tenantDoc.id}_patients`),
          where('isActive', '==', true)
        );
        const patientsSnapshot = await getDocs(patientsQuery);
        totalPatients += patientsSnapshot.size;

        // Get revenue for this tenant (simplified - would need date filtering)
        const billingQuery = collection(firestore, `labflow_${tenantDoc.id}_billing_invoices`);
        const billingSnapshot = await getDocs(billingQuery);
        billingSnapshot.forEach(doc => {
          const invoice = doc.data();
          if (invoice.status === 'paid') {
            totalRevenue += invoice.totalAmount || 0;
          }
        });
      }

      const adminStats: AdminStats = {
        totalTenants: tenantsSnapshot.size,
        activeTenants,
        totalUsers: usersSnapshot.size,
        totalPatients,
        totalRevenue,
        activeSubscriptions,
      };

      return adminStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: tenantSummaries, isLoading: summariesLoading } = useQuery({
    queryKey: ['tenantSummaries'],
    queryFn: async () => {
      const tenantsSnapshot = await getDocs(collection(firestore, 'tenants'));
      const summaries: TenantSummary[] = [];

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenant = tenantDoc.data();
        
        // Get user count
        const usersQuery = query(
          collection(firestore, 'users'),
          where('tenantId', '==', tenantDoc.id)
        );
        const usersSnapshot = await getDocs(usersQuery);

        // Get patient count
        const patientsCollection = `labflow_${tenantDoc.id}_patients`;
        const patientsSnapshot = await getDocs(collection(firestore, patientsCollection));

        // Get test count
        const testsCollection = `labflow_${tenantDoc.id}_test_orders`;
        const testsSnapshot = await getDocs(collection(firestore, testsCollection));

        // Get revenue
        const invoicesCollection = `labflow_${tenantDoc.id}_billing_invoices`;
        const invoicesSnapshot = await getDocs(collection(firestore, invoicesCollection));
        let revenue = 0;
        invoicesSnapshot.forEach(doc => {
          const invoice = doc.data();
          if (invoice.status === 'paid') {
            revenue += invoice.totalAmount || 0;
          }
        });

        summaries.push({
          id: tenantDoc.id,
          name: tenant.name,
          code: tenant.code,
          userCount: usersSnapshot.size,
          patientCount: patientsSnapshot.size,
          testCount: testsSnapshot.size,
          revenue,
          lastActivity: tenant.lastActivityAt?.toDate() || new Date(),
          subscriptionStatus: tenant.subscription?.status || 'inactive',
        });
      }

      // Sort summaries based on URL params
      const sorted = [...summaries];
      sorted.sort((a, b) => {
        let compareValue = 0;
        switch (sortBy) {
          case 'name':
            compareValue = a.name.localeCompare(b.name);
            break;
          case 'userCount':
            compareValue = a.userCount - b.userCount;
            break;
          case 'patientCount':
            compareValue = a.patientCount - b.patientCount;
            break;
          case 'testCount':
            compareValue = a.testCount - b.testCount;
            break;
          case 'revenue':
            compareValue = a.revenue - b.revenue;
            break;
          case 'lastActivity':
            compareValue = a.lastActivity.getTime() - b.lastActivity.getTime();
            break;
          default:
            compareValue = b.revenue - a.revenue;
        }
        return sortOrder === 'asc' ? compareValue : -compareValue;
      });

      return sorted;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate paginated results
  const paginatedSummaries = tenantSummaries ? 
    tenantSummaries.slice((currentPage - 1) * pageSize, currentPage * pageSize) : [];
  const totalPages = tenantSummaries ? Math.ceil(tenantSummaries.length / pageSize) : 0;

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.totalTenants || 0,
      subtitle: `${stats?.activeTenants || 0} active`,
      icon: '🏢',
      color: 'bg-primary-100 text-primary-800',
      link: '/admin/tenants',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      subtitle: 'Across all tenants',
      icon: '👥',
      color: 'bg-secondary-100 text-secondary-800',
      link: '/admin/users',
    },
    {
      title: 'Total Patients',
      value: stats?.totalPatients?.toLocaleString() || '0',
      subtitle: 'System-wide',
      icon: '🏥',
      color: 'bg-info-100 text-info-800',
      link: '/admin/patients',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      subtitle: `${stats?.activeSubscriptions || 0} active subscriptions`,
      icon: '💰',
      color: 'bg-success-100 text-success-800',
      link: '/admin/revenue',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System-wide overview and tenant management
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          className="input w-auto"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(stat.link)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {statsLoading ? '...' : stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.subtitle}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Summary Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tenant Overview
          </h2>
          <select
            value={pageSize.toString()}
            onChange={(e) => updateURLParams({ pageSize: e.target.value, page: '1' })}
            className="input w-auto"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => updateURLParams({ 
                    sortBy: 'name', 
                    sortOrder: sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc',
                    page: '1'
                  })}
                >
                  Tenant {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => updateURLParams({ 
                    sortBy: 'userCount', 
                    sortOrder: sortBy === 'userCount' && sortOrder === 'asc' ? 'desc' : 'asc',
                    page: '1'
                  })}
                >
                  Users {sortBy === 'userCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => updateURLParams({ 
                    sortBy: 'patientCount', 
                    sortOrder: sortBy === 'patientCount' && sortOrder === 'asc' ? 'desc' : 'asc',
                    page: '1'
                  })}
                >
                  Patients {sortBy === 'patientCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => updateURLParams({ 
                    sortBy: 'testCount', 
                    sortOrder: sortBy === 'testCount' && sortOrder === 'asc' ? 'desc' : 'asc',
                    page: '1'
                  })}
                >
                  Tests {sortBy === 'testCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => updateURLParams({ 
                    sortBy: 'revenue', 
                    sortOrder: sortBy === 'revenue' && sortOrder === 'asc' ? 'desc' : 'asc',
                    page: '1'
                  })}
                >
                  Revenue {sortBy === 'revenue' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => updateURLParams({ 
                    sortBy: 'lastActivity', 
                    sortOrder: sortBy === 'lastActivity' && sortOrder === 'asc' ? 'desc' : 'asc',
                    page: '1'
                  })}
                >
                  Last Activity {sortBy === 'lastActivity' && (sortOrder === 'asc' ? '↑' : '↓')}
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
              {summariesLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading tenant data...
                    </div>
                  </td>
                </tr>
              ) : paginatedSummaries && paginatedSummaries.length > 0 ? (
                paginatedSummaries.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tenant.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {tenant.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tenant.userCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tenant.patientCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tenant.testCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(tenant.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(tenant.lastActivity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tenant.subscriptionStatus === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/tenants/${tenant.id}`);
                        }}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No tenants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, tenantSummaries?.length || 0)} of {tenantSummaries?.length || 0} tenants
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateURLParams({ page: (currentPage - 1).toString() })}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (currentPage <= 3) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = currentPage - 2 + idx;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateURLParams({ page: pageNum.toString() })}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => updateURLParams({ page: (currentPage + 1).toString() })}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;