import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { equipmentService } from '../../services/equipment';
import { useAuthStore } from '../../stores/authStore';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import EquipmentCard from './EquipmentCard';
import { CpuChipIcon } from '@heroicons/react/24/outline';

const EquipmentList: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const { data: equipment, isLoading, error, refetch } = useQuery({
    queryKey: ['equipment'],
    queryFn: equipmentService.getEquipment,
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;
  if (!equipment || equipment.length === 0) {
    return (
      <div className="text-center py-12">
        <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">No equipment configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Equipment Interface</h1>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((item) => (
          <EquipmentCard key={item.id} equipment={item} />
        ))}
      </div>
    </div>
  );
};

export default EquipmentList;