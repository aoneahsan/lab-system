import React, { useState } from 'react';
import { Users, UserPlus, Phone, Calendar, ChevronRight, Mail, Heart, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: Date;
  email: string;
  phone: string;
  isEmergencyContact: boolean;
  hasAccess: boolean;
  profilePicture?: string;
  lastVisit?: Date;
}

const MobileFamilyPage: React.FC = () => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Mock data for family members
  const [familyMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      relationship: 'Spouse',
      dateOfBirth: new Date(1985, 6, 15),
      email: 'sarah.johnson@example.com',
      phone: '(555) 123-4567',
      isEmergencyContact: true,
      hasAccess: true,
      lastVisit: new Date(2024, 9, 20)
    },
    {
      id: '2',
      name: 'Michael Johnson',
      relationship: 'Son',
      dateOfBirth: new Date(2010, 3, 22),
      email: 'michael.j@example.com',
      phone: '(555) 234-5678',
      isEmergencyContact: false,
      hasAccess: false,
      lastVisit: new Date(2024, 8, 15)
    },
    {
      id: '3',
      name: 'Emma Johnson',
      relationship: 'Daughter',
      dateOfBirth: new Date(2012, 11, 5),
      email: 'emma.j@example.com',
      phone: '(555) 345-6789',
      isEmergencyContact: false,
      hasAccess: false,
      lastVisit: new Date(2024, 9, 1)
    },
    {
      id: '4',
      name: 'Robert Johnson Sr.',
      relationship: 'Father',
      dateOfBirth: new Date(1955, 2, 10),
      email: 'robert.sr@example.com',
      phone: '(555) 456-7890',
      isEmergencyContact: true,
      hasAccess: true
    }
  ]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleAddMember = () => {
    // In production, this would navigate to add member form
    console.log('Add family member');
    setShowAddMember(false);
  };

  const handleEditMember = (member: FamilyMember) => {
    // In production, this would navigate to edit form
    console.log('Edit member:', member.id);
  };

  const handleRemoveMember = (member: FamilyMember) => {
    // In production, this would show confirmation and remove
    console.log('Remove member:', member.id);
  };

  const handleToggleAccess = (member: FamilyMember) => {
    // In production, this would update access permissions
    console.log('Toggle access for:', member.id);
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Family Members</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your family's health records</p>
            </div>
            <button
              onClick={() => setShowAddMember(true)}
              className="p-2 bg-indigo-600 text-white rounded-lg"
            >
              <UserPlus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-indigo-600 mr-2" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{familyMembers.length}</p>
                  <p className="text-xs text-gray-600">Total Members</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {familyMembers.filter(m => m.isEmergencyContact).length}
                  </p>
                  <p className="text-xs text-gray-600">Emergency Contacts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Family Members List */}
      <div className="flex-1 px-4 py-4">
        <div className="space-y-3">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div
                onClick={() => setSelectedMember(member)}
                className="p-4 cursor-pointer"
              >
                <div className="flex items-start">
                  {/* Profile Picture or Initials */}
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    {member.profilePicture ? (
                      <img
                        src={member.profilePicture}
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 font-semibold">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-600">
                          {member.relationship} • {calculateAge(member.dateOfBirth)} years old
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {member.isEmergencyContact && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          Emergency Contact
                        </span>
                      )}
                      {member.hasAccess && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Has Access
                        </span>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-3 w-3 mr-2" />
                        {member.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-2" />
                        {member.email}
                      </div>
                      {member.lastVisit && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-2" />
                          Last visit: {format(member.lastVisit, 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAccess(member);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {member.hasAccess ? 'Remove Access' : 'Grant Access'}
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditMember(member);
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMember(member);
                    }}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Member Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowAddMember(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 flex items-center justify-center"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add Family Member
          </button>
        </div>
      </div>

      {/* Add Member Modal (simplified) */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Family Member</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the family member's email address to send them an invitation.
            </p>
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddMember(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20" />
    </div>
  );
};

export default MobileFamilyPage;