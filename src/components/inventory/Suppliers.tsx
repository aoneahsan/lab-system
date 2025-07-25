import React, { useState, useEffect } from 'react';
import { Plus, Building2, Mail, Phone, Globe, Edit, Trash2 } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventory.store';
import { Supplier } from '@/types/inventory';

export default function Suppliers() {
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    accountNumber: '',
    paymentTerms: '',
    notes: '',
  });

  const { suppliers, loading, fetchSuppliers, createSupplier, updateSupplier } = useInventoryStore();

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, formData);
    } else {
      await createSupplier(formData);
    }

    // Reset form
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      accountNumber: '',
      paymentTerms: '',
      notes: '',
    });
    setShowAddSupplier(false);
    setEditingSupplier(null);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      website: supplier.website || '',
      accountNumber: supplier.accountNumber || '',
      paymentTerms: supplier.paymentTerms || '',
      notes: supplier.notes || '',
    });
    setShowAddSupplier(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Suppliers</h2>
        <button 
          onClick={() => setShowAddSupplier(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      {/* Add/Edit Supplier Form */}
      {showAddSupplier && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="input"
                  placeholder="Net 30, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddSupplier(false);
                  setEditingSupplier(null);
                  setFormData({
                    name: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    website: '',
                    accountNumber: '',
                    paymentTerms: '',
                    notes: '',
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {editingSupplier ? 'Update' : 'Add'} Supplier
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <Building2 className="h-8 w-8 text-gray-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-1">{supplier.name}</h3>
            
            {supplier.contactPerson && (
              <p className="text-sm text-gray-600 mb-2">{supplier.contactPerson}</p>
            )}

            <div className="space-y-1 text-sm text-gray-500">
              {supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  <a 
                    href={supplier.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900 truncate"
                  >
                    {supplier.website}
                  </a>
                </div>
              )}
            </div>

            {supplier.paymentTerms && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Terms: {supplier.paymentTerms}</span>
              </div>
            )}

            <div className="mt-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                supplier.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {supplier.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No suppliers added yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first supplier to get started</p>
        </div>
      )}
    </div>
  );
}