import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-utils';
import { useNavigate } from 'react-router-dom';

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
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

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

      return summaries.sort((a, b) => b.revenue - a.revenue);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tenant Overview
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Patients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Activity
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
              ) : tenantSummaries && tenantSummaries.length > 0 ? (
                tenantSummaries.map((tenant) => (
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
      </div>
    </div>
  );
};

export default AdminDashboard;