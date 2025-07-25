import React, { useState } from 'react';
import { Equipment, equipmentService } from '../../services/equipment';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CpuChipIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface EquipmentCardProps {
  equipment: Equipment;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: () => equipmentService.syncData(equipment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsSyncing(false);
    },
    onError: () => {
      setIsSyncing(false);
    }
  });

  const handleSync = () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  const getStatusIcon = () => {
    switch (equipment.status) {
      case 'online':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      case 'maintenance':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (equipment.status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <CpuChipIcon className="h-10 w-10 text-gray-400" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{equipment.name}</h3>
              <p className="text-sm text-gray-500">{equipment.model}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-1">{equipment.status}</span>
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Manufacturer:</span>
            <span className="font-medium">{equipment.manufacturer}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Serial Number:</span>
            <span className="font-medium">{equipment.serialNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Interface:</span>
            <span className="font-medium">{equipment.interface}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Department:</span>
            <span className="font-medium">{equipment.department}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Last Sync:</span>
            <span className="font-medium">
              {new Date(equipment.lastSync).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleSync}
            disabled={isSyncing || equipment.status !== 'online'}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <>
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Sync Data
              </>
            )}
          </button>
          <button
            onClick={() => {/* View logs */}}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;