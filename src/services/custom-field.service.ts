import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { getFirestoreCollectionName, COLLECTION_NAMES } from '@/config/firebase-collections-helper';
import type {
  CustomFieldDefinition,
  CreateCustomFieldData,
  UpdateCustomFieldData,
  CustomFieldSection,
} from '@/types/custom-field.types';

class CustomFieldService {
  private getCollectionName(tenantId: string): string {
    return getFirestoreCollectionName(COLLECTION_NAMES.CUSTOM_FIELDS, tenantId);
  }

  private formatCustomFieldData(data: Record<string, unknown>): CustomFieldDefinition {
    const toDate = (value: unknown): Date | undefined => {
      if (!value) return undefined;
      if (value instanceof Date) return value;
      if (value instanceof Timestamp) return value.toDate();
      if (typeof value === 'object' && 'toDate' in value) {
        return (value as any).toDate();
      }
      return undefined;
    };

    return {
      ...data,
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
    } as CustomFieldDefinition;
  }

  async createCustomField(
    tenantId: string,
    data: CreateCustomFieldData,
    createdBy: string
  ): Promise<CustomFieldDefinition> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      
      // Check if field key already exists for this module
      const existingFields = await this.getCustomFieldsByModule(tenantId, data.module);
      const fieldExists = existingFields.some(field => field.fieldKey === data.fieldKey);
      
      if (fieldExists) {
        throw new Error(`Field with key "${data.fieldKey}" already exists for module "${data.module}"`);
      }

      // If no display order provided, set it to the end
      const displayOrder = data.displayOrder ?? existingFields.length;

      const fieldData = {
        ...data,
        tenantId,
        isActive: true,
        displayOrder,
        createdAt: serverTimestamp(),
        createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: createdBy,
      };

      const docRef = await addDoc(collection(firestore, collectionName), fieldData);
      const newDoc = await getDoc(docRef);

      return this.formatCustomFieldData({
        id: docRef.id,
        ...newDoc.data(),
      });
    } catch (error) {
      console.error('Error creating custom field:', error);
      throw error;
    }
  }

  async updateCustomField(
    tenantId: string,
    fieldId: string,
    data: UpdateCustomFieldData,
    updatedBy: string
  ): Promise<CustomFieldDefinition> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const docRef = doc(firestore, collectionName, fieldId);

      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy,
      });

      const updatedDoc = await getDoc(docRef);
      return this.formatCustomFieldData({
        id: fieldId,
        ...updatedDoc.data(),
      });
    } catch (error) {
      console.error('Error updating custom field:', error);
      throw error;
    }
  }

  async getCustomField(tenantId: string, fieldId: string): Promise<CustomFieldDefinition | null> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const docRef = doc(firestore, collectionName, fieldId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.formatCustomFieldData({
        id: docSnap.id,
        ...docSnap.data(),
      });
    } catch (error) {
      console.error('Error fetching custom field:', error);
      throw error;
    }
  }

  async getCustomFieldsByModule(
    tenantId: string,
    module: CustomFieldDefinition['module'],
    activeOnly: boolean = true
  ): Promise<CustomFieldDefinition[]> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const constraints = [
        where('module', '==', module),
        orderBy('displayOrder', 'asc'),
      ];

      if (activeOnly) {
        constraints.push(where('isActive', '==', true));
      }

      const q = query(collection(firestore, collectionName), ...constraints);
      const snapshot = await getDocs(q);

      const fields: CustomFieldDefinition[] = [];
      snapshot.docs.forEach((doc) => {
        fields.push(this.formatCustomFieldData({
          id: doc.id,
          ...doc.data(),
        }));
      });

      return fields;
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      throw error;
    }
  }

  async getCustomFieldSections(
    tenantId: string,
    module: CustomFieldDefinition['module']
  ): Promise<CustomFieldSection[]> {
    try {
      const fields = await this.getCustomFieldsByModule(tenantId, module);
      
      // Group fields by section
      const sectionsMap = new Map<string, CustomFieldDefinition[]>();
      const defaultSection = 'Additional Information';
      
      fields.forEach(field => {
        const section = field.section || defaultSection;
        if (!sectionsMap.has(section)) {
          sectionsMap.set(section, []);
        }
        sectionsMap.get(section)!.push(field);
      });

      // Convert to array and sort
      const sections: CustomFieldSection[] = Array.from(sectionsMap.entries()).map(([name, fields], index) => ({
        name,
        label: name,
        fields,
        displayOrder: name === defaultSection ? 999 : index,
      }));

      return sections.sort((a, b) => a.displayOrder - b.displayOrder);
    } catch (error) {
      console.error('Error fetching custom field sections:', error);
      throw error;
    }
  }

  async deleteCustomField(tenantId: string, fieldId: string): Promise<void> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const docRef = doc(firestore, collectionName, fieldId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting custom field:', error);
      throw error;
    }
  }

  async reorderCustomFields(
    tenantId: string,
    module: CustomFieldDefinition['module'],
    fieldOrders: Array<{ fieldId: string; displayOrder: number }>,
    updatedBy: string
  ): Promise<void> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      
      // Update each field's display order
      const updatePromises = fieldOrders.map(({ fieldId, displayOrder }) =>
        updateDoc(doc(firestore, collectionName, fieldId), {
          displayOrder,
          updatedAt: serverTimestamp(),
          updatedBy,
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error reordering custom fields:', error);
      throw error;
    }
  }

  // Validate custom field values against their definitions
  validateCustomFieldValues(
    fields: CustomFieldDefinition[],
    values: Record<string, any>
  ): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = values[field.fieldKey];

      // Check required fields
      if (field.isRequired && (value === undefined || value === null || value === '')) {
        errors[field.fieldKey] = field.validations?.find(v => v.type === 'required')?.message || 
          `${field.label} is required`;
        isValid = false;
        return;
      }

      // Skip validation if value is empty and field is not required
      if (!field.isRequired && (value === undefined || value === null || value === '')) {
        return;
      }

      // Type-specific validations
      field.validations?.forEach(validation => {
        switch (validation.type) {
          case 'min':
            if (field.type === 'number' && typeof value === 'number' && value < (validation.value as number)) {
              errors[field.fieldKey] = validation.message || `${field.label} must be at least ${validation.value}`;
              isValid = false;
            }
            break;
          case 'max':
            if (field.type === 'number' && typeof value === 'number' && value > (validation.value as number)) {
              errors[field.fieldKey] = validation.message || `${field.label} must be at most ${validation.value}`;
              isValid = false;
            }
            break;
          case 'minLength':
            if (typeof value === 'string' && value.length < (validation.value as number)) {
              errors[field.fieldKey] = validation.message || `${field.label} must be at least ${validation.value} characters`;
              isValid = false;
            }
            break;
          case 'maxLength':
            if (typeof value === 'string' && value.length > (validation.value as number)) {
              errors[field.fieldKey] = validation.message || `${field.label} must be at most ${validation.value} characters`;
              isValid = false;
            }
            break;
          case 'pattern':
            if (typeof value === 'string' && !new RegExp(validation.value as string).test(value)) {
              errors[field.fieldKey] = validation.message || `${field.label} format is invalid`;
              isValid = false;
            }
            break;
          case 'email':
            if (field.type === 'email' && typeof value === 'string' && 
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors[field.fieldKey] = validation.message || `${field.label} must be a valid email`;
              isValid = false;
            }
            break;
          case 'url':
            if (field.type === 'url' && typeof value === 'string' && 
                !/^https?:\/\/.+/.test(value)) {
              errors[field.fieldKey] = validation.message || `${field.label} must be a valid URL`;
              isValid = false;
            }
            break;
        }
      });
    });

    return { isValid, errors };
  }
}

export const customFieldService = new CustomFieldService();