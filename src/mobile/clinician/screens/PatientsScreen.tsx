import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, User, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Patient {
  id: string;
  name: string;
  mrn: string;
  dob: string;
  age: number;
  gender: string;
  lastVisit: string;
  hasActiveOrders: boolean;
  hasCriticalResults: boolean;
  condition?: string;
}

export const PatientsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'critical'>('all');

  const patients: Patient[] = [
    {
      id: '1',
      name: 'John Doe',
      mrn: 'MRN123456',
      dob: '1980-05-15',
      age: 43,
      gender: 'Male',
      lastVisit: '2024-10-25',
      hasActiveOrders: true,
      hasCriticalResults: true,
      condition: 'Diabetes Type 2',
    },
    {
      id: '2',
      name: 'Jane Smith',
      mrn: 'MRN123457',
      dob: '1975-08-22',
      age: 48,
      gender: 'Female',
      lastVisit: '2024-10-20',
      hasActiveOrders: true,
      hasCriticalResults: false,
      condition: 'Hypertension',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      mrn: 'MRN123458',
      dob: '1990-12-10',
      age: 33,
      gender: 'Male',
      lastVisit: '2024-10-15',
      hasActiveOrders: false,
      hasCriticalResults: false,
      condition: 'Annual Checkup',
    },
    {
      id: '4',
      name: 'Mary Wilson',
      mrn: 'MRN123459',
      dob: '1965-03-30',
      age: 58,
      gender: 'Female',
      lastVisit: '2024-10-27',
      hasActiveOrders: true,
      hasCriticalResults: true,
      condition: 'CKD Stage 3',
    },
  ];

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.mrn.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'active' && patient.hasActiveOrders) ||
                         (filterType === 'critical' && patient.hasCriticalResults);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">My Patients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredPatients.length} patients
          </p>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or MRN..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All Patients
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'active' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Active Orders
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'critical' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Critical Results
            </button>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="p-4 space-y-3">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-lg shadow-sm p-4"
            onClick={() => navigate(`/clinician/patient/${patient.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">
                      {patient.mrn} • {patient.age}y {patient.gender.charAt(0)}
                    </p>
                    {patient.condition && (
                      <p className="text-sm text-gray-600 mt-1">{patient.condition}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Last: {format(new Date(patient.lastVisit), 'MMM dd')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {patient.hasActiveOrders && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Active Orders
                      </span>
                    )}
                    {patient.hasCriticalResults && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Critical
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <ChevronRight className="h-5 w-5 text-gray-400 mt-3" />
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="p-8 text-center">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No patients found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};