import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CalendarIcon, HomeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { AppointmentFormData } from '@/types/appointment.types';
import { usePatients } from '@/hooks/usePatients';
import { useTests } from '@/hooks/useTests';
import { useAvailableSlots, useCreateAppointment } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/Button';
import { SelectField, DateField, TimeField, TextField, LexicalEditorField, CheckboxField } from '@/components/form-fields';
import { uiLogger } from '@/services/logger.service';

const schema = yup.object({
  patientId: yup.string().required('Patient is required'),
  locationId: yup.string().required('Location is required'),
  appointmentType: yup.string().oneOf(['scheduled', 'home-collection'] as const).required(),
  scheduledDate: yup.string().required('Date is required'),
  scheduledTime: yup.string().required('Time is required'),
  testIds: yup.array().of(yup.string().required()).required().min(1, 'At least one test is required'),
  specialInstructions: yup.string().optional(),
  fastingRequired: yup.boolean().required(),
  homeAddress: yup.string().when('appointmentType', {
    is: 'home-collection',
    then: (schema) => schema.required('Address is required for home collection'),
    otherwise: (schema) => schema.optional(),
  }),
  homeLandmark: yup.string().optional(),
  preferredTimeSlot: yup.string().optional(),
}).required();

interface AppointmentBookingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  patientId?: string;
}

export const AppointmentBookingForm: React.FC<AppointmentBookingFormProps> = ({
  onSuccess,
  onCancel,
  patientId: initialPatientId,
}) => {
  const [selectedDate] = useState(new Date());
  const { data: patients } = usePatients();
  const { data: tests } = useTests();
  const createAppointment = useCreateAppointment();
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      patientId: initialPatientId || '',
      appointmentType: 'scheduled',
      fastingRequired: false,
      testIds: [],
    },
  });

  const appointmentType = watch('appointmentType');
  const locationId = watch('locationId');
  const watchedDate = watch('scheduledDate');

  // Get available slots when date/location changes
  const { data: availableSlots } = useAvailableSlots(
    locationId,
    watchedDate ? new Date(watchedDate) : selectedDate,
    appointmentType === 'scheduled' ? 'regular' : 'home-collection'
  );

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      const patient = patients?.patients?.find(p => p.id === data.patientId);
      const selectedTests = tests?.filter(t => data.testIds.includes(t.id)) || [];
      
      await createAppointment.mutateAsync({
        patientId: data.patientId,
        patientName: patient ? patient.fullName : '',
        patientPhone: patient?.phoneNumber || '',
        patientEmail: patient?.email,
        locationId: data.locationId,
        locationName: 'Main Lab', // This would come from location data
        appointmentType: data.appointmentType === 'home-collection' ? 'home-collection' : 'scheduled',
        scheduledDate: new Date(`${data.scheduledDate}T${data.scheduledTime}`),
        scheduledTime: data.scheduledTime,
        duration: 30, // Default duration
        testIds: data.testIds,
        testNames: selectedTests.map(t => t.name),
        specialInstructions: data.specialInstructions,
        fastingRequired: data.fastingRequired,
        homeCollection: data.appointmentType === 'home-collection' ? {
          address: data.homeAddress || '',
          landmark: data.homeLandmark,
          preferredTimeSlot: data.preferredTimeSlot,
        } : undefined,
      });

      onSuccess?.();
    } catch (error) {
      uiLogger.error('Error creating appointment:', error);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient Selection */}
      <div>
        <Label htmlFor="patientId">Patient *</Label>
        <Select
          id="patientId"
          {...register('patientId')}
          className="mt-1"
          disabled={!!initialPatientId}
        >
          <option value="">Select Patient</option>
          {patients?.patients?.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.fullName} - {patient.phoneNumber}
            </option>
          ))}
        </Select>
        {errors.patientId && (
          <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
        )}
      </div>

      {/* Appointment Type */}
      <div>
        <Label>Appointment Type *</Label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              {...register('appointmentType')}
              value="scheduled"
              className="mr-2"
            />
            <span className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Lab Visit
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              {...register('appointmentType')}
              value="home-collection"
              className="mr-2"
            />
            <span className="flex items-center">
              <HomeIcon className="h-4 w-4 mr-1" />
              Home Collection
            </span>
          </label>
        </div>
      </div>

      {/* Location (for lab visit) */}
      {appointmentType === 'scheduled' && (
        <div>
          <Label htmlFor="locationId">Lab Location *</Label>
          <Select id="locationId" {...register('locationId')} className="mt-1">
            <option value="">Select Location</option>
            <option value="main-lab">Main Laboratory</option>
            <option value="branch-1">Downtown Branch</option>
            <option value="branch-2">North Side Branch</option>
          </Select>
          {errors.locationId && (
            <p className="mt-1 text-sm text-red-600">{errors.locationId.message}</p>
          )}
        </div>
      )}

      {/* Date Selection */}
      <DateField
        label="Appointment Date *"
        {...register('scheduledDate')}
        error={errors.scheduledDate}
        min={today}
        required
      />

      {/* Time Slot Selection */}
      <div>
        <Label htmlFor="scheduledTime">Time Slot *</Label>
        <Select id="scheduledTime" {...register('scheduledTime')} className="mt-1">
          <option value="">Select Time Slot</option>
          {availableSlots?.map(slot => (
            <option 
              key={slot.id} 
              value={slot.startTime}
              disabled={slot.available === 0}
            >
              {slot.startTime} - {slot.endTime} ({slot.available} slots available)
            </option>
          ))}
        </Select>
        {errors.scheduledTime && (
          <p className="mt-1 text-sm text-red-600">{errors.scheduledTime.message}</p>
        )}
      </div>

      {/* Test Selection */}
      <div>
        <Label>Select Tests *</Label>
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
          {tests?.map(test => (
            <label key={test.id} className="flex items-center">
              <input
                type="checkbox"
                value={test.id}
                {...register('testIds')}
                className="mr-2"
              />
              <span className="text-sm">{test.name} ({test.code})</span>
            </label>
          ))}
        </div>
        {errors.testIds && (
          <p className="mt-1 text-sm text-red-600">{errors.testIds.message}</p>
        )}
      </div>

      {/* Fasting Required */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="fastingRequired"
          {...register('fastingRequired')}
          className="mr-2"
        />
        <Label htmlFor="fastingRequired">Fasting Required</Label>
      </div>

      {/* Home Collection Details */}
      {appointmentType === 'home-collection' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h3 className="font-medium flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2" />
            Home Collection Details
          </h3>
          
          <LexicalEditorField
            name="homeAddress"
            control={control}
            label="Address *"
            rules={{ required: 'Address is required for home collection' }}
            error={errors.homeAddress?.message}
            minHeight="100px"
            placeholder="Full address for home collection"
          />

          <TextField
            label="Landmark"
            {...register('homeLandmark')}
            placeholder="Near..."
          />

          <SelectField
            label="Preferred Time Slot"
            {...register('preferredTimeSlot')}
            options={[
              { value: '', label: 'Any Time' },
              { value: 'morning', label: 'Morning (8 AM - 12 PM)' },
              { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
              { value: 'evening', label: 'Evening (5 PM - 8 PM)' },
            ]}
          />
        </div>
      )}

      {/* Special Instructions */}
      <LexicalEditorField
        name="specialInstructions"
        control={control}
        label="Special Instructions"
        minHeight="100px"
        placeholder="Any special instructions for the appointment"
        />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={createAppointment.isPending}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </div>
    </form>
  );
};