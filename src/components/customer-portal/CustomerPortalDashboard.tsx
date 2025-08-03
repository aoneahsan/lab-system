import { useAuthStore } from '@/stores/auth.store';
import { usePortalDashboard } from '@/hooks/useCustomerPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  CreditCard, 
  Download,
  Upload,
  Share2,
  Bell,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function CustomerPortalDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { data: dashboard, isLoading } = usePortalDashboard(currentUser?.id || '');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name}</h1>
          <p className="text-gray-600 mt-1">Here's your health dashboard</p>
        </div>
        <Button onClick={() => navigate('/portal/notifications')}>
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/portal/results')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">View Results</p>
                <p className="text-2xl font-bold">{dashboard.totalResults}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/portal/appointments/book')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Calendar className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-sm text-gray-600">Book Appointment</p>
                <p className="text-lg font-medium">Schedule Now</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/portal/prescriptions')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Upload className="h-8 w-8 text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Upload Prescription</p>
                <p className="text-lg font-medium">Add New</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/portal/invoices')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CreditCard className="h-8 w-8 text-orange-600 mb-2" />
                <p className="text-sm text-gray-600">Pending Bills</p>
                <p className="text-2xl font-bold">{dashboard.pendingInvoices.length}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Test Results</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portal/results')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent results</p>
            ) : (
              <div className="space-y-3">
                {dashboard.recentResults.map((result) => (
                  <div 
                    key={result.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/portal/results/${result.id}`)}
                  >
                    <div>
                      <p className="font-medium">{result.testName}</p>
                      <p className="text-sm text-gray-500">
                        {format(result.date, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                        {result.status}
                      </Badge>
                      <Download className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Appointments</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portal/appointments')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No upcoming appointments</p>
                <Button onClick={() => navigate('/portal/appointments/book')}>
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.upcomingAppointments.map((appointment) => (
                  <div 
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{appointment.type}</p>
                      <p className="text-sm text-gray-500">
                        {format(appointment.date, 'MMM dd, yyyy - hh:mm a')}
                      </p>
                      <p className="text-sm text-gray-500">{appointment.location}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/portal/appointments/${appointment.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        {dashboard.pendingInvoices.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pending Payments</span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/portal/invoices')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.pendingInvoices.map((invoice) => (
                  <div 
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200"
                  >
                    <div>
                      <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">
                        Due: {format(invoice.dueDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold">₹{invoice.amount.toFixed(2)}</p>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/portal/invoices/${invoice.id}/pay`)}
                      >
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => navigate('/portal/results/share')}
            >
              <Share2 className="h-6 w-6 mb-2" />
              Share Results
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => navigate('/portal/prescriptions/upload')}
            >
              <Upload className="h-6 w-6 mb-2" />
              Upload Prescription
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => navigate('/portal/profile')}
            >
              <FileText className="h-6 w-6 mb-2" />
              Medical History
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col py-4"
              onClick={() => navigate('/portal/settings')}
            >
              <Bell className="h-6 w-6 mb-2" />
              Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}