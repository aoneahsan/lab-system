import React from 'react';
import { Users } from 'lucide-react';

const MobileFamilyPage: React.FC = () => {
  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Family Members</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Family management coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default MobileFamilyPage;