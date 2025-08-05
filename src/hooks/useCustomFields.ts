import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFieldService } from '@/services/custom-field.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/use-toast';
import type {
  CustomFieldDefinition,
  CreateCustomFieldData,
  UpdateCustomFieldData,
} from '@/types/custom-field.types';

// Query keys
const CUSTOM_FIELD_KEYS = {
  all: ['customFields'] as const,
  byModule: (module: string) => [...CUSTOM_FIELD_KEYS.all, 'module', module] as const,
  detail: (id: string) => [...CUSTOM_FIELD_KEYS.all, 'detail', id] as const,
  sections: (module: string) => [...CUSTOM_FIELD_KEYS.all, 'sections', module] as const,
};

// Get custom fields by module
export const useCustomFieldsByModule = (module: CustomFieldDefinition['module'], activeOnly = true) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: [...CUSTOM_FIELD_KEYS.byModule(module), activeOnly],
    queryFn: () => customFieldService.getCustomFieldsByModule(currentTenant!.id, module, activeOnly),
    enabled: !!currentTenant?.id,
  });
};

// Get custom field sections
export const useCustomFieldSections = (module: CustomFieldDefinition['module']) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: CUSTOM_FIELD_KEYS.sections(module),
    queryFn: () => customFieldService.getCustomFieldSections(currentTenant!.id, module),
    enabled: !!currentTenant?.id,
  });
};

// Get single custom field
export const useCustomField = (fieldId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: CUSTOM_FIELD_KEYS.detail(fieldId),
    queryFn: () => customFieldService.getCustomField(currentTenant!.id, fieldId),
    enabled: !!currentTenant?.id && !!fieldId,
  });
};

// Create custom field
export const useCreateCustomField = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCustomFieldData) =>
      customFieldService.createCustomField(currentTenant!.id, data, user!.uid),
    onSuccess: (field) => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.byModule(field.module) });
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.sections(field.module) });
      toast({
        title: 'Success',
        description: 'Custom field created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create custom field',
        variant: 'destructive',
      });
    },
  });
};

// Update custom field
export const useUpdateCustomField = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: string; data: UpdateCustomFieldData }) =>
      customFieldService.updateCustomField(currentTenant!.id, fieldId, data, user!.uid),
    onSuccess: (field) => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.detail(field.id) });
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.byModule(field.module) });
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.sections(field.module) });
      toast({
        title: 'Success',
        description: 'Custom field updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update custom field',
        variant: 'destructive',
      });
    },
  });
};

// Delete custom field
export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (fieldId: string) => customFieldService.deleteCustomField(currentTenant!.id, fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.all });
      toast({
        title: 'Success',
        description: 'Custom field deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete custom field',
        variant: 'destructive',
      });
    },
  });
};

// Reorder custom fields
export const useReorderCustomFields = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      module,
      fieldOrders,
    }: {
      module: CustomFieldDefinition['module'];
      fieldOrders: Array<{ fieldId: string; displayOrder: number }>;
    }) =>
      customFieldService.reorderCustomFields(currentTenant!.id, module, fieldOrders, user!.uid),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.byModule(variables.module) });
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELD_KEYS.sections(variables.module) });
      toast({
        title: 'Success',
        description: 'Custom fields reordered successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder custom fields',
        variant: 'destructive',
      });
    },
  });
};

// Validate custom field values
export const useValidateCustomFields = () => {
  return (fields: CustomFieldDefinition[], values: Record<string, any>) => {
    return customFieldService.validateCustomFieldValues(fields, values);
  };
};