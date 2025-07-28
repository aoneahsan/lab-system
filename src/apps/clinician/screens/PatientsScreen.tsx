import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, User, Calendar, Phone, ChevronRight, Activity, FileText } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { format, differenceInYears } from 'date-fns';

export function PatientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: patientsData, isLoading } = usePatients({
    searchTerm: searchQuery,
  });

  const patients = Array.isArray(patientsData) ? patientsData : patientsData?.patients || [];

  const calculateAge = (dateOfBirth: string) => {
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
        <p className="text-sm text-gray-600 mt-1">
          {patients.length} active patient{patients.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="search"
          placeholder="Search by name, MRN, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Loading patients...</p>
          </Card>
        ) : patients.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No patients found</p>
          </Card>
        ) : (
          patients.map((patient) => (
            <Link key={patient.id} to={`/clinician/patients/${patient.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {patient.fullName || `${patient.firstName} ${patient.lastName}`}
                        </h3>
                        <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{calculateAge(patient.dateOfBirth)} years</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{patient.phoneNumber || 'No phone'}</span>
                      </div>
                    </div>

                    {patient.recentActivity && (
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-gray-600">
                            Last visit: {format(new Date(patient.lastVisit), 'MMM d')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-600">
                            {patient.recentTests} recent tests
                          </span>
                        </div>
                      </div>
                    )}

                    {patient.tags && patient.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {patient.tags.slice(0, 3).map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" size="sm">
                            {tag}
                          </Badge>
                        ))}
                        {patient.tags.length > 3 && (
                          <Badge variant="outline" size="sm">
                            +{patient.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
