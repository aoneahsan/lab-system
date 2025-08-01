import React, { useState, useEffect } from 'react';
import { Plus, Building2, Phone, Mail, Globe, Edit2, Trash2 } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventory.store';
import { useAuthStore } from '@/stores/auth.store';
import { VendorForm } from '@/components/inventory/VendorForm';
import { Button } from '@/components/ui/Button';
import type { Vendor } from '@/types/inventory.types';
import { toast } from 'sonner';

const VendorsPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { currentTenant } = useAuthStore();
  const { vendors, loading, fetchVendors, createVendor, updateVendor, deleteVendor } = useInventoryStore();

  useEffect(() => {
    if (currentTenant) {
      fetchVendors();
    }
  }, [currentTenant, fetchVendors]);

  const handleAddVendor = async (data: Partial<Vendor>) => {
    if (!currentTenant) return;
    
    try {
      await createVendor(data);
      toast.success('Vendor added successfully');
      setShowAddForm(false);
    } catch (error) {
      toast.error('Failed to add vendor');
    }
  };

  const handleEditVendor = async (data: Partial<Vendor>) => {
    if (!currentTenant || !editingVendor) return;
    
    try {
      await updateVendor(editingVendor.id, data);
      toast.success('Vendor updated successfully');
      setEditingVendor(null);
    } catch (error) {
      toast.error('Failed to update vendor');
    }
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!currentTenant) return;
    
    if (window.confirm(`Are you sure you want to delete ${vendor.name}?`)) {
      try {
        await deleteVendor(vendor.id);
        toast.success('Vendor deleted successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete vendor';
        toast.error(errorMessage);
      }
    }
  };

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showAddForm || editingVendor) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h1>
          <p className="text-gray-600 mt-2">
            {editingVendor ? 'Update vendor information' : 'Create a new vendor/supplier'}
          </p>
        </div>

        <VendorForm
          initialData={editingVendor || undefined}
          onSubmit={editingVendor ? handleEditVendor : handleAddVendor}
          onCancel={() => {
            setShowAddForm(false);
            setEditingVendor(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-600 mt-2">Manage suppliers and vendors</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading vendors...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No vendors found matching your search.' : 'No vendors added yet. Add your first vendor to get started.'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="mt-4"
            >
              Add First Vendor
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{vendor.name}</h3>
                      {vendor.contactPerson && (
                        <p className="text-sm text-gray-600">{vendor.contactPerson}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingVendor(vendor)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit vendor"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Delete vendor"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${vendor.phone}`} className="hover:text-blue-600">
                        {vendor.phone}
                      </a>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${vendor.email}`} className="hover:text-blue-600">
                        {vendor.email}
                      </a>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={vendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}
                </div>

                {vendor.address && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">{vendor.address}</p>
                  </div>
                )}

                {vendor.leadTimeDays && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      Lead time: <span className="font-medium">{vendor.leadTimeDays} days</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorsPage;