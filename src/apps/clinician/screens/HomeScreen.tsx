import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  AlertCircle, 
  ClipboardList, 
  FileText, 
  Users, 
  Activity,
  Clock
} from 'lucide-react';
import { useCriticalResults } from '@/hooks/useCriticalResults';
import { usePendingOrders } from '@/hooks/usePendingOrders';
import { useStats } from '@/hooks/useStats';
import { format } from 'date-fns';

export function HomeScreen() {
  const { currentUser } = useAuthStore();
  const { data: criticalResults = [] } = useCriticalResults();
  const { data: pendingOrders = [] } = usePendingOrders();
  const { data: stats } = useStats();

  const quickActions = [
    { icon: ClipboardList, label: 'New Order', path: '/clinician/orders/new', color: 'blue' },
    { icon: FileText, label: 'Test Catalog', path: '/clinician/test-catalog', color: 'green' },
    { icon: Users, label: 'My Patients', path: '/clinician/patients', color: 'purple' },
    { icon: AlertCircle, label: 'Critical Results', path: '/clinician/critical-results', color: 'red' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, Dr. {currentUser?.displayName}
        </h1>
        <p className="text-gray-600 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Critical Alerts */}
      {criticalResults.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-red-900">
                  Critical Results Pending
                </h2>
              </div>
              <span className="bg-red-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {criticalResults.length}
              </span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Immediate attention required for critical test results
            </p>
            <Link to="/clinician/critical-results">
              <Button variant="primary" size="sm" className="w-full">
                Review Critical Results
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`p-3 rounded-full bg-${action.color}-100`}>
                    <action.icon className={`h-6 w-6 text-${action.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {action.label}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Today's Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingOrders.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Results Ready</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.resultsReady || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activePatients || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tests Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.testsToday || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {stats?.recentActivity?.map((activity: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(activity.timestamp), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}