import { useState } from 'react';
import { Users, TestTube, Vial, FileText, DollarSign, Package } from 'lucide-react';
import PatientAdminControls from './PatientAdminControls';
import TestAdminControls from './TestAdminControls';
import SampleAdminControls from './SampleAdminControls';
import ResultAdminControls from './ResultAdminControls';
import BillingAdminControls from './BillingAdminControls';
import InventoryAdminControls from './InventoryAdminControls';

const modules = [
  { id: 'patients', label: 'Patients', icon: Users, component: PatientAdminControls },
  { id: 'tests', label: 'Tests', icon: TestTube, component: TestAdminControls },
  { id: 'samples', label: 'Samples', icon: Vial, component: SampleAdminControls },
  { id: 'results', label: 'Results', icon: FileText, component: ResultAdminControls },
  { id: 'billing', label: 'Billing', icon: DollarSign, component: BillingAdminControls },
  { id: 'inventory', label: 'Inventory', icon: Package, component: InventoryAdminControls },
];

export default function ModuleAdminControls() {
  const [activeModule, setActiveModule] = useState('patients');
  
  const ActiveComponent = modules.find(m => m.id === activeModule)?.component || PatientAdminControls;

  return (
    <div className="space-y-6">
      {/* Module Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all ${
                activeModule === module.id
                  ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <module.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{module.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Module Controls */}
      <ActiveComponent />
    </div>
  );
}