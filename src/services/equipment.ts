import { api } from './api';

export interface Equipment {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSync: Date;
  interface: 'HL7' | 'ASTM' | 'API' | 'File';
  department: string;
}

export interface EquipmentData {
  equipmentId: string;
  timestamp: Date;
  results: any[];
  status: string;
}

export const equipmentService = {
  // Get all equipment
  async getEquipment(): Promise<Equipment[]> {
    const response = await api.get('/api/equipment');
    return response.data;
  },

  // Get equipment by ID
  async getEquipmentById(id: string): Promise<Equipment> {
    const response = await api.get(`/api/equipment/${id}`);
    return response.data;
  },

  // Sync data from equipment
  async syncData(equipmentId: string): Promise<any> {
    const response = await api.post(`/api/equipment/${equipmentId}/sync`);
    return response.data;
  },

  // Get equipment logs
  async getLogs(equipmentId: string, days: number = 7): Promise<any[]> {
    const response = await api.get(`/api/equipment/${equipmentId}/logs`, {
      params: { days }
    });
    return response.data;
  },

  // Update equipment status
  async updateStatus(equipmentId: string, status: Equipment['status']): Promise<void> {
    await api.patch(`/api/equipment/${equipmentId}/status`, { status });
  },

  // Process equipment data
  async processData(data: EquipmentData): Promise<any> {
    const response = await api.post('/api/equipment/process', data);
    return response.data;
  }
};