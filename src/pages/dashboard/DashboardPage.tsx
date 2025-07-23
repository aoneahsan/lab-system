import { useAuthStore } from '@stores/auth.store';
import { useTenant } from '@hooks/useTenant';

const DashboardPage = () => {
  const { currentUser } = useAuthStore();
  const { tenant } = useTenant();
  
  const stats = [
    { label: 'Total Patients', value: '1,234', icon: '👥', color: 'bg-primary-100 text-primary-800' },
    { label: 'Tests Today', value: '56', icon: '🧪', color: 'bg-success-100 text-success-800' },
    { label: 'Pending Results', value: '23', icon: '⏳', color: 'bg-warning-100 text-warning-800' },
    { label: 'Revenue Today', value: '$4,567', icon: '💰', color: 'bg-secondary-100 text-secondary-800' },
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
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn btn-outline">
            <span className="mr-2">➕</span>
            New Patient
          </button>
          <button className="btn btn-outline">
            <span className="mr-2">🧪</span>
            New Test
          </button>
          <button className="btn btn-outline">
            <span className="mr-2">📋</span>
            Enter Results
          </button>
          <button className="btn btn-outline">
            <span className="mr-2">💳</span>
            Process Payment
          </button>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Tests
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Patient #{1000 + i}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    CBC, Lipid Panel
                  </p>
                </div>
                <span className="badge badge-warning">Pending</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Critical Results
          </h3>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Patient #{2000 + i}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Glucose: 450 mg/dL
                  </p>
                </div>
                <span className="badge badge-danger">Critical</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;