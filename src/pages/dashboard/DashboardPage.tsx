import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { useDashboardSummary, useRecentTests, useCriticalResults } from '@/hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';

const DashboardPage = () => {
  const { currentUser } = useAuthStore();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: recentTests, isLoading: testsLoading } = useRecentTests(3);
  const { data: criticalResults, isLoading: criticalLoading } = useCriticalResults(2);

  const stats = [
    {
      label: 'Total Patients',
      value: summaryLoading ? '...' : summary?.totalPatients.toLocaleString() || '0',
      icon: '👥',
      color: 'bg-primary-100 text-primary-800',
      link: '/patients',
    },
    {
      label: 'Tests Today',
      value: summaryLoading ? '...' : summary?.testsToday.toLocaleString() || '0',
      icon: '🧪',
      color: 'bg-success-100 text-success-800',
      link: '/tests/orders',
    },
    {
      label: 'Pending Results',
      value: summaryLoading ? '...' : summary?.pendingResults.toLocaleString() || '0',
      icon: '⏳',
      color: 'bg-warning-100 text-warning-800',
      link: '/results',
    },
    {
      label: 'Revenue Today',
      value: summaryLoading ? '...' : formatCurrency(summary?.revenueToday || 0),
      icon: '💰',
      color: 'bg-secondary-100 text-secondary-800',
      link: '/billing',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {currentUser?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's what's happening at {tenant?.name} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(stat.link)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${stat.color}`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/patients?action=new')}
          >
            <span className="mr-2">➕</span>
            New Patient
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/tests/orders?action=new')}
          >
            <span className="mr-2">🧪</span>
            New Test Order
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/results/entry')}
          >
            <span className="mr-2">📋</span>
            Enter Results
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/billing/payments?action=new')}
          >
            <span className="mr-2">💳</span>
            Process Payment
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Tests</h3>
          {testsLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </div>
            </div>
          ) : recentTests && recentTests.length > 0 ? (
            <div className="space-y-3">
              {recentTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => navigate(`/tests/orders/${test.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{test.patientName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {test.testNames.slice(0, 2).join(', ')}
                      {test.testNames.length > 2 && ` +${test.testNames.length - 2} more`}
                    </p>
                  </div>
                  <span className={`badge ${
                    test.status === 'completed' ? 'badge-success' : 
                    test.status === 'in_progress' ? 'badge-info' : 
                    'badge-warning'
                  }`}>
                    {test.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent tests</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Critical Results
          </h3>
          {criticalLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </div>
            </div>
          ) : criticalResults && criticalResults.length > 0 ? (
            <div className="space-y-3">
              {criticalResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg cursor-pointer hover:bg-danger-100 dark:hover:bg-danger-900/30"
                  onClick={() => navigate(`/results?id=${result.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{result.patientName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.testName}: {result.value}
                    </p>
                  </div>
                  <span className={`badge ${
                    result.severity === 'critical' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {result.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No critical results</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
