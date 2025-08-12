import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateHomeCollection } from '@/hooks/useHomeCollection';
import { usePatients } from '@/hooks/usePatients';
import { useTests } from '@/hooks/useTests';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Clock, MapPin, TestTube } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { HomeCollectionFormData } from '@/types/home-collection.types';

const schema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  testIds: z.array(z.string()).min(1, 'At least one test is required'),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTimeSlot: z.string().min(1, 'Time slot is required'),
  priority: z.enum(['urgent', 'high', 'normal', 'low']),
  address: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    landmark: z.string().optional()
  }),
  specialInstructions: z.string().optional(),
  fastingRequired: z.boolean(),
  paymentMethod: z.enum(['prepaid', 'cash', 'card', 'insurance'])
});

const timeSlots = [
  '06:00-08:00',
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00'
];

export function HomeCollectionForm() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  
  const { data: patientsData } = usePatients();
  const patients = patientsData?.patients || [];
  const { data: tests = [] } = useTests();
  const createMutation = useCreateHomeCollection();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<HomeCollectionFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      priority: 'normal',
      fastingRequired: false,
      paymentMethod: 'cash'
    }
  });

  const selectedPatientId = watch('patientId');
  const selectedPatient = patients?.find((p: any) => p.id === selectedPatientId);

  const onSubmit = async (data: HomeCollectionFormData) => {
    try {
      await createMutation.mutateAsync(data);
      navigate('/home-collection');
    } catch {
      // Error handled by mutation
    }
  };

  const handleTestToggle = (testId: string) => {
    const newTests = selectedTests.includes(testId)
      ? selectedTests.filter(id => id !== testId)
      : [...selectedTests, testId];
    
    setSelectedTests(newTests);
    setValue('testIds', newTests);
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setValue('scheduledDate', format(newDate, 'yyyy-MM-dd'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Schedule Home Collection</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/home-collection')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Scheduling...' : 'Schedule Collection'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patientId">Patient</Label>
              <Select
                value={watch('patientId')}
                onChange={(e) => setValue('patientId', e.target.value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} - {patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patientId && (
                <p className="text-sm text-red-500 mt-1">{errors.patientId.message}</p>
              )}
            </div>

            {selectedPatient && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="font-medium">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-sm text-gray-600">Phone: {selectedPatient.phone}</p>
                <p className="text-sm text-gray-600">
                  DOB: {format(new Date(selectedPatient.dateOfBirth), 'MMM dd, yyyy')}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watch('priority')}
                onChange={(e) => setValue('priority', e.target.value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="fastingRequired"
                checked={watch('fastingRequired')}
                onCheckedChange={(checked) => setValue('fastingRequired', checked)}
              />
              <Label htmlFor="fastingRequired">Fasting Required</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Collection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.scheduledDate && (
                <p className="text-sm text-red-500 mt-1">{errors.scheduledDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="scheduledTimeSlot">Time Slot</Label>
              <Select
                value={watch('scheduledTimeSlot')}
                onChange={(e) => setValue('scheduledTimeSlot', e.target.value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.scheduledTimeSlot && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.scheduledTimeSlot.message}
                </p>
              )}
            </div>

            <div>
              <Label>Special Instructions</Label>
              <Textarea
                {...register('specialInstructions')}
                placeholder="Any special instructions for the phlebotomist..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Collection Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address.line1">Address Line 1</Label>
              <Input
                {...register('address.line1')}
                placeholder="Street address"
              />
              {errors.address?.line1 && (
                <p className="text-sm text-red-500 mt-1">{errors.address.line1.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address.line2">Address Line 2</Label>
              <Input
                {...register('address.line2')}
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address.city">City</Label>
                <Input {...register('address.city')} />
                {errors.address?.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address.state">State</Label>
                <Input {...register('address.state')} />
                {errors.address?.state && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.state.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address.postalCode">Postal Code</Label>
              <Input {...register('address.postalCode')} />
              {errors.address?.postalCode && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.address.postalCode.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="address.landmark">Landmark</Label>
              <Input
                {...register('address.landmark')}
                placeholder="Near landmark (optional)"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Tests & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Tests</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {tests.map((test) => (
                  <label
                    key={test.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => handleTestToggle(test.id)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {test.name} - {test.code}
                    </span>
                  </label>
                ))}
              </div>
              {errors.testIds && (
                <p className="text-sm text-red-500 mt-1">{errors.testIds.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={watch('paymentMethod')}
                onChange={(e) => setValue('paymentMethod', e.target.value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="cash">Cash on Collection</SelectItem>
                  <SelectItem value="card">Card on Collection</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}