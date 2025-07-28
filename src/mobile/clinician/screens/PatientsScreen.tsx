import React, { useState } from 'react';
import {
  Search,
  Filter,
  User,
  Calendar,
  Phone,
  ChevronRight,
  AlertCircle,
  Activity,
  FileText,
  Clock,
  Star,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Patient {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  lastVisit: Date;
  nextAppointment?: Date;
  phone: string;
  conditions: string[];
  recentTests: number;
  criticalAlerts: number;
  starred: boolean;
}

export const PatientsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [patients] = useState<Patient[]>([
    {
      id: '1',
      name: 'Emma Wilson',
      mrn: 'MRN001234',
      age: 45,
      gender: 'F',
      lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextAppointment: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      phone: '(555) 123-4567',
      conditions: ['Diabetes Type 2', 'Hypertension'],
      recentTests: 5,
      criticalAlerts: 1,
      starred: true,
    },
    {
      id: '2',
      name: 'James Chen',
      mrn: 'MRN001235',
      age: 62,
      gender: 'M',
      lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      phone: '(555) 234-5678',
      conditions: ['CHF', 'CKD Stage 3'],
      recentTests: 8,
      criticalAlerts: 2,
      starred: true,
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      mrn: 'MRN001236',
      age: 28,
      gender: 'F',
      lastVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      phone: '(555) 345-6789',
      conditions: ['Pregnancy - 24 weeks'],
      recentTests: 3,
      criticalAlerts: 0,
      starred: false,
    },
    {
      id: '4',
      name: 'Michael Brown',
      mrn: 'MRN001237',
      age: 55,
      gender: 'M',
      lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      phone: '(555) 456-7890',
      conditions: ['COPD', 'OSA'],
      recentTests: 4,
      criticalAlerts: 0,
      starred: false,
    },
  ]);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      searchQuery === '' ||
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'starred' && patient.starred) ||
      (filterType === 'critical' && patient.criticalAlerts > 0) ||
      (filterType === 'recent' &&
        patient.lastVisit > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesFilter;
  });

  const toggleStar = (patientId: string) => {
    console.log('Toggle star for patient:', patientId);
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg ${
                showFilters ? 'bg-blue-50 border-blue-300' : 'border-gray-300'
              }`}
            >
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 flex space-x-2 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'All Patients' },
                { id: 'starred', label: 'Starred' },
                { id: 'critical', label: 'Critical' },
                { id: 'recent', label: 'Recent Visits' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    filterType === filter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patient List */}
      <div className="p-4 space-y-3">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => navigate(`/clinician/patient/${patient.id}`)}
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(patient.id);
                    }}
                    className="text-gray-400 hover:text-yellow-500"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        patient.starred ? 'fill-yellow-500 text-yellow-500' : ''
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {patient.mrn} • {patient.age}y {patient.gender}
                </p>
              </div>
              {patient.criticalAlerts > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {patient.criticalAlerts}
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Activity className="h-4 w-4 mr-2" />
                <span>{patient.conditions.join(', ')}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Last: {format(patient.lastVisit, 'MMM d')}</span>
                </div>
                {patient.nextAppointment && (
                  <div className="flex items-center text-blue-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Next: {format(patient.nextAppointment, 'MMM d')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-gray-600">
                    <FileText className="h-4 w-4 mr-1" />
                    {patient.recentTests} tests
                  </span>
                  <a
                    href={`tel:${patient.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center text-blue-600"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </a>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        ))}

        {filteredPatients.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No patients found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try a different search' : 'Add patients to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            <p className="text-xs text-gray-600">Total Patients</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {patients.filter((p) => p.nextAppointment).length}
            </p>
            <p className="text-xs text-gray-600">Upcoming</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {patients.filter((p) => p.criticalAlerts > 0).length}
            </p>
            <p className="text-xs text-gray-600">Critical</p>
          </div>
        </div>
      </div>
    </div>
  );
};
