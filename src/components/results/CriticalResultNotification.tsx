import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Mail, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { COLLECTIONS } from '@/config/firebase-collections';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { notificationService } from '@/services/notification.service';
import type { TestResult } from '@/types/result.types';
import type { Patient } from '@/types/patient.types';

interface CriticalResultNotificationProps {
  result: TestResult;
  patient: Patient;
  onNotified?: () => void;
}

interface NotificationAttempt {
  method: 'phone' | 'sms' | 'email';
  timestamp: Date;
  successful: boolean;
  notes?: string;
  notifiedBy: string;
}

const CriticalResultNotification: React.FC<CriticalResultNotificationProps> = ({
  result,
  patient,
  onNotified,
}) => {
  const { currentUser } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<'phone' | 'sms' | 'email' | null>(null);
  const [notificationNotes, setNotificationNotes] = useState('');
  const [contactPerson, setContactPerson] = useState('patient');
  const [customContact, setCustomContact] = useState('');
  const [attempts, setAttempts] = useState<NotificationAttempt[]>([]);

  // Load existing notification attempts
  useEffect(() => {
    if (result.notificationAttempts) {
      setAttempts(result.notificationAttempts);
    }
  }, [result.notificationAttempts]);

  // Record notification mutation
  const recordNotificationMutation = useMutation({
    mutationFn: async (data: {
      method: 'phone' | 'sms' | 'email';
      successful: boolean;
      notes: string;
    }) => {
      if (!currentUser) throw new Error('User not authenticated');

      const attempt: NotificationAttempt = {
        method: data.method,
        timestamp: new Date(),
        successful: data.successful,
        notes: data.notes,
        notifiedBy: currentUser.displayName || currentUser.email || '',
      };

      const updateData: any = {
        notificationAttempts: [...attempts, attempt],
        updatedAt: serverTimestamp(),
      };

      if (data.successful) {
        updateData.criticalNotifiedAt = serverTimestamp();
        updateData.criticalNotifiedBy = currentUser.displayName || currentUser.email;
      }

      await updateDoc(doc(firestore, COLLECTIONS.RESULTS, result.id), updateData);

      // Send actual notification if email or SMS
      if (data.successful && (data.method === 'email' || data.method === 'sms')) {
        const contact = contactPerson === 'custom' ? customContact : 
                       data.method === 'email' ? patient.email : patient.phoneNumbers?.[0]?.value;
        
        if (contact) {
          await notificationService.sendCriticalResultNotification({
            method: data.method,
            recipient: contact,
            patientName: `${patient.firstName} ${patient.lastName}`,
            testName: result.testName,
            value: `${result.value} ${result.unit || ''}`,
            flag: result.flag,
          });
        }
      }

      return attempt;
    },
    onSuccess: (attempt) => {
      setAttempts([...attempts, attempt]);
      if (attempt.successful) {
        toast.success('Notification Recorded', 'Critical result notification has been documented');
        if (onNotified) onNotified();
      } else {
        toast.warning('Attempt Recorded', 'Unsuccessful notification attempt has been documented');
      }
      setSelectedMethod(null);
      setNotificationNotes('');
    },
    onError: () => {
      toast.error('Recording Failed', 'Failed to record notification attempt');
    },
  });

  const handleRecordNotification = (successful: boolean) => {
    if (!selectedMethod) {
      toast.error('Method Required', 'Please select a notification method');
      return;
    }

    recordNotificationMutation.mutate({
      method: selectedMethod,
      successful,
      notes: notificationNotes,
    });
  };

  const getContactInfo = () => {
    const contacts = [];
    
    if (patient.phoneNumbers?.length > 0) {
      contacts.push({
        type: 'phone',
        value: patient.phoneNumbers[0].value,
        label: patient.phoneNumbers[0].type || 'Primary',
      });
    }
    
    if (patient.email) {
      contacts.push({
        type: 'email',
        value: patient.email,
        label: 'Email',
      });
    }

    if (patient.emergencyContacts?.length > 0) {
      patient.emergencyContacts.forEach(contact => {
        if (contact.phone) {
          contacts.push({
            type: 'emergency',
            value: contact.phone,
            label: `Emergency: ${contact.name} (${contact.relationship})`,
          });
        }
      });
    }

    return contacts;
  };

  const contacts = getContactInfo();
  const isNotified = result.criticalNotifiedAt != null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-900">Critical Result Notification Required</h3>
          <p className="text-sm text-red-700 mt-1">
            This result requires immediate notification to the patient or ordering provider
          </p>
        </div>
      </div>

      {/* Result Details */}
      <div className="bg-white rounded-md p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Test</p>
            <p className="font-medium">{result.testName}</p>
          </div>
          <div>
            <p className="text-gray-500">Result</p>
            <p className="font-medium text-red-600">
              {result.value} {result.unit || ''} ({result.flag.replace('_', ' ').toUpperCase()})
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Contacts</h4>
        {contacts.length > 0 ? (
          <div className="space-y-2 text-sm">
            {contacts.map((contact, index) => (
              <div key={index} className="flex items-center gap-2">
                {contact.type === 'phone' || contact.type === 'emergency' ? (
                  <Phone className="h-4 w-4 text-gray-400" />
                ) : (
                  <Mail className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-gray-600">{contact.label}:</span>
                <span className="font-medium">{contact.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No contact information available</p>
        )}
      </div>

      {/* Notification History */}
      {attempts.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Attempts</h4>
          <div className="space-y-2">
            {attempts.map((attempt, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  attempt.successful ? 'bg-green-100' : 'bg-yellow-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {attempt.successful ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {attempt.method.toUpperCase()} - {attempt.successful ? 'Successful' : 'Unsuccessful'}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(attempt.timestamp).toLocaleString()}
                  </span>
                </div>
                {attempt.notes && (
                  <p className="text-gray-600 mt-1 ml-6">{attempt.notes}</p>
                )}
                <p className="text-gray-500 text-xs mt-1 ml-6">By: {attempt.notifiedBy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Form */}
      {!isNotified && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedMethod('phone')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedMethod === 'phone'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Phone className="h-4 w-4 mx-auto mb-1" />
                Phone Call
              </button>
              <button
                onClick={() => setSelectedMethod('sms')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedMethod === 'sms'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                SMS
              </button>
              <button
                onClick={() => setSelectedMethod('email')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedMethod === 'email'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Mail className="h-4 w-4 mx-auto mb-1" />
                Email
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Person
            </label>
            <select
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            >
              <option value="patient">Patient</option>
              <option value="provider">Ordering Provider</option>
              <option value="emergency">Emergency Contact</option>
              <option value="custom">Other</option>
            </select>
          </div>

          {contactPerson === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information
              </label>
              <input
                type="text"
                value={customContact}
                onChange={(e) => setCustomContact(e.target.value)}
                placeholder="Phone number or email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Notes
            </label>
            <textarea
              value={notificationNotes}
              onChange={(e) => setNotificationNotes(e.target.value)}
              placeholder="Who was contacted, what was discussed, any follow-up required..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleRecordNotification(true)}
              disabled={!selectedMethod || recordNotificationMutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Record Successful Notification
            </button>
            <button
              onClick={() => handleRecordNotification(false)}
              disabled={!selectedMethod || recordNotificationMutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Record Failed Attempt
            </button>
          </div>
        </div>
      )}

      {/* Already Notified Status */}
      {isNotified && (
        <div className="bg-green-100 rounded-md p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Critical Result Notified</p>
              <p className="text-sm text-green-700">
                Notified by {result.criticalNotifiedBy} on{' '}
                {result.criticalNotifiedAt?.toDate?.().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalResultNotification;