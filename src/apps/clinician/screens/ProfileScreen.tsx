import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
  Fingerprint,
  Award,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { modalService } from '@/services/modal.service';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = async () => {
    if (await modalService.confirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel'
    })) {
      await logout();
      navigate('/login');
    }
  };

  const handleBiometricSetup = () => {
    // Implement biometric setup
    toast.success('Biometric authentication enabled');
  };

  if (!currentUser) {
    return null;
  }

  const menuItems = [
    {
      icon: Bell,
      label: 'Notification Settings',
      value: 'All notifications enabled',
      onClick: () => navigate('/clinician/settings/notifications'),
    },
    {
      icon: Fingerprint,
      label: 'Biometric Authentication',
      value: 'Not configured',
      onClick: handleBiometricSetup,
    },
    {
      icon: Shield,
      label: 'Security Settings',
      value: 'Two-factor enabled',
      onClick: () => navigate('/clinician/settings/security'),
    },
    {
      icon: Award,
      label: 'Certifications',
      value: '3 active',
      onClick: () => navigate('/clinician/certifications'),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-10 w-10 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dr. {currentUser.displayName}</h1>
            <p className="text-gray-600">
              {currentUser.metadata?.specialization || 'General Practitioner'}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">
                <Shield className="h-3 w-3 mr-1" />
                {currentUser.metadata?.licenseNumber || 'LIC123456'}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Active
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{currentUser.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{currentUser.phoneNumber || '+1 (555) 123-4567'}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Building className="h-4 w-4" />
            <span>{currentUser.metadata?.department || 'Internal Medicine'}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Joined {format(new Date(currentUser.createdAt || Date.now()), 'MMM yyyy')}</span>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">247</p>
          <p className="text-sm text-gray-600">Total Orders</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">1,823</p>
          <p className="text-sm text-gray-600">Results Reviewed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">156</p>
          <p className="text-sm text-gray-600">Active Patients</p>
        </Card>
      </div>

      {/* Work Schedule */}
      <Card className="p-4">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Work Schedule
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monday - Friday</span>
            <span className="font-medium">8:00 AM - 5:00 PM</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">On Call</span>
            <span className="font-medium">Every 3rd weekend</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Next On Call</span>
            <span className="font-medium text-blue-600">Dec 15-17</span>
          </div>
        </div>
      </Card>

      {/* Settings Menu */}
      <Card className="divide-y">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">{item.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{item.value}</span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </button>
        ))}
      </Card>

      {/* Logout Button */}
      <Card className="p-4">
        <Button
          variant="outline"
          className="w-full text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </Card>
    </div>
  );
}
