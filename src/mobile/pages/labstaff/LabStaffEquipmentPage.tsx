import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Wrench,
  Thermometer,
  Droplet,
  Power,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/useToast';

interface Equipment {
  id: string;
  name: string;
  type: 'analyzer' | 'centrifuge' | 'refrigerator' | 'incubator';
  model: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastMaintenance: Date;
  nextMaintenance: Date;
  parameters?: {
    temperature?: number;
    humidity?: number;
    rpm?: number;
    runtime?: string;
  };
  alerts: Alert[];
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

const LabStaffEquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  
  // Mock data - in real app would fetch from API
  const [equipment] = useState<Equipment[]>([
    {
      id: '1',
      name: 'Chemistry Analyzer A1',
      type: 'analyzer',
      model: 'ChemMaster 5000',
      status: 'online',
      lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      parameters: {
        temperature: 37.2,
        runtime: '124h 32m',
      },
      alerts: [],
    },
    {
      id: '2',
      name: 'Hematology Analyzer H1',
      type: 'analyzer',
      model: 'HemaCount Pro',
      status: 'error',
      lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      parameters: {
        temperature: 36.8,
        runtime: '89h 15m',
      },
      alerts: [
        {
          id: '1',
          type: 'error',
          message: 'Reagent level critical - Replace immediately',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
      ],
    },
    {
      id: '3',
      name: 'Sample Refrigerator R1',
      type: 'refrigerator',
      model: 'CoolStore 300',
      status: 'online',
      lastMaintenance: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      parameters: {
        temperature: 4.1,
        humidity: 45,
      },
      alerts: [],
    },
    {
      id: '4',
      name: 'Centrifuge C1',
      type: 'centrifuge',
      model: 'SpinMaster 2000',
      status: 'maintenance',
      lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now()),
      parameters: {
        rpm: 0,
        runtime: '0h 0m',
      },
      alerts: [
        {
          id: '2',
          type: 'warning',
          message: 'Scheduled maintenance in progress',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
    },
  ]);

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50';
      case 'offline':
        return 'text-gray-600 bg-gray-50';
      case 'maintenance':
        return 'text-orange-600 bg-orange-50';
      case 'error':
        return 'text-red-600 bg-red-50';
    }
  };

  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-5 w-5" />;
      case 'offline':
        return <WifiOff className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getEquipmentIcon = (type: Equipment['type']) => {
    switch (type) {
      case 'analyzer':
        return <Activity className="h-6 w-6" />;
      case 'centrifuge':
        return <Cpu className="h-6 w-6" />;
      case 'refrigerator':
        return <Thermometer className="h-6 w-6" />;
      case 'incubator':
        return <Droplet className="h-6 w-6" />;
    }
  };

  const handleMaintenanceLog = (equipmentId: string) => {
    toast.info('Opening maintenance log...');
  };

  const handleRunDiagnostics = (equipmentId: string) => {
    toast.info('Running diagnostics...');
  };

  const equipmentStats = {
    total: equipment.length,
    online: equipment.filter(e => e.status === 'online').length,
    offline: equipment.filter(e => e.status === 'offline').length,
    alerts: equipment.reduce((acc, e) => acc + e.alerts.length, 0),
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Equipment Status</h1>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{equipmentStats.total}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-green-600">{equipmentStats.online}</p>
            <p className="text-xs text-gray-600">Online</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-600">{equipmentStats.offline}</p>
            <p className="text-xs text-gray-600">Offline</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-600">{equipmentStats.alerts}</p>
            <p className="text-xs text-gray-600">Alerts</p>
          </div>
        </div>

        {/* Alert Banner */}
        {equipmentStats.alerts > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-900 font-medium">
              {equipmentStats.alerts} equipment alert{equipmentStats.alerts > 1 ? 's' : ''} require attention
            </p>
          </div>
        )}
      </div>

      {/* Equipment List */}
      <div className="flex-1 px-6 py-4 space-y-4">
        {equipment.map((equip) => (
          <div
            key={equip.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div
              className="p-4"
              onClick={() => setSelectedEquipment(selectedEquipment === equip.id ? null : equip.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    {getEquipmentIcon(equip.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{equip.name}</h3>
                    <p className="text-sm text-gray-600">{equip.model}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(equip.status)}`}>
                        {getStatusIcon(equip.status)}
                        {equip.status.toUpperCase()}
                      </span>
                      {equip.alerts.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          {equip.alerts.length} Alert{equip.alerts.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parameters */}
              {equip.parameters && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {equip.parameters.temperature !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Temp:</span>
                      <span className="font-medium">{equip.parameters.temperature}°C</span>
                    </div>
                  )}
                  {equip.parameters.humidity !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Droplet className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Humidity:</span>
                      <span className="font-medium">{equip.parameters.humidity}%</span>
                    </div>
                  )}
                  {equip.parameters.rpm !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">RPM:</span>
                      <span className="font-medium">{equip.parameters.rpm}</span>
                    </div>
                  )}
                  {equip.parameters.runtime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Power className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Runtime:</span>
                      <span className="font-medium">{equip.parameters.runtime}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Expanded Section */}
            {selectedEquipment === equip.id && (
              <div className="border-t border-gray-100">
                {/* Alerts */}
                {equip.alerts.length > 0 && (
                  <div className="p-4 bg-red-50">
                    <h4 className="font-medium text-red-900 mb-2">Active Alerts</h4>
                    {equip.alerts.map((alert) => (
                      <div key={alert.id} className="text-sm text-red-800 mb-2">
                        <p>{alert.message}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {alert.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Maintenance Info */}
                <div className="p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Maintenance Schedule</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Maintenance:</span>
                      <span className="font-medium">{equip.lastMaintenance.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Due:</span>
                      <span className="font-medium">{equip.nextMaintenance.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => handleMaintenanceLog(equip.id)}
                      className="py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
                    >
                      View Log
                    </button>
                    <button
                      onClick={() => handleRunDiagnostics(equip.id)}
                      className="py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium"
                    >
                      Diagnostics
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabStaffEquipmentPage;