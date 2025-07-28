import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ClipboardList,
  AlertCircle,
  Download,
} from 'lucide-react';
import { usePatient } from '@/hooks/usePatient';
import { usePatientOrders } from '@/hooks/usePatientOrders';
import { usePatientResults } from '@/hooks/usePatientResults';
import { format, differenceInYears } from 'date-fns';

export function PatientDetailScreen() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(patientId!);
  const { data: orders = [] } = usePatientOrders(patientId!);
  const { data: results = [] } = usePatientResults(patientId!);

  const recentOrders = orders.slice(0, 5);
  const recentResults = results.slice(0, 5);

  if (isLoading || !patient) {
    return (
      <div className="p-4">
        <Card className="p-8 text-center">
          <p className="text-gray-500">Loading patient details...</p>
        </Card>
      </div>
    );
  }

  const age = differenceInYears(new Date(), new Date(patient.dateOfBirth));

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clinician/patients')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Patient Info */}
      <Card className="p-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-8 w-8 text-gray-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600">MRN: {patient.mrn}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{patient.gender}</Badge>
              <Badge variant="outline">{age} years</Badge>
              <Badge variant="outline">{patient.bloodGroup || 'Unknown'}</Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Contact Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{patient.phoneNumbers?.[0]?.value || 'No phone'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-start space-x-2 text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  {patient.addresses?.[0]
                    ? `${patient.addresses[0].line1}, ${patient.addresses[0].city}`
                    : 'No address'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Demographics</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date of Birth</span>
                <span className="font-medium">
                  {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Insurance</span>
                <span className="font-medium">
                  {patient.insurances?.[0]?.provider || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Emergency Contact</span>
                <span className="font-medium">
                  {patient.emergencyContacts?.[0]?.name || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History */}
        {patient.medicalHistory && patient.medicalHistory.length > 0 && (
          <div className="border-t pt-4">
            <h2 className="font-semibold text-gray-900 mb-3">Medical History</h2>
            <div className="flex flex-wrap gap-2">
              {patient.medicalHistory.map((history, index) => (
                <Badge key={index} variant="outline">
                  {history.condition}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Allergies */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Allergies
            </h2>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy, index) => (
                <Badge key={index} className="bg-red-100 text-red-800">
                  {allergy.allergen} - {allergy.severity}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="primary"
          onClick={() => navigate(`/clinician/orders/new?patientId=${patient.id}`)}
          className="flex items-center justify-center"
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          New Order
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/clinician/results?patientId=${patient.id}`)}
          className="flex items-center justify-center"
        >
          <FileText className="h-4 w-4 mr-2" />
          View All Results
        </Button>
      </div>

      {/* Recent Orders */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Recent Orders
          </h2>
          <Link
            to={`/clinician/orders?patientId=${patient.id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent orders</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/clinician/orders/${order.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                    <p className="text-xs text-gray-600">
                      {order.tests.length} tests •{' '}
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    {order.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Results */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Recent Results
          </h2>
          <Link
            to={`/clinician/results?patientId=${patient.id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        {recentResults.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent results</p>
        ) : (
          <div className="space-y-2">
            {recentResults.map((result) => (
              <Link
                key={result.id}
                to={`/clinician/results/${result.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{result.testName}</p>
                    <p className="text-xs text-gray-600">
                      {result.value} {result.unit} •{' '}
                      {format(new Date(result.resultDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {result.isCritical && (
                    <Badge className="bg-red-100 text-red-800" size="sm">
                      Critical
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
