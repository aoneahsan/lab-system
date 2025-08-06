import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, Shield } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data: users, isLoading } = useUsers();
  const user = users?.find(u => u.id === userId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Details
          </h1>
        </div>
        <button
          onClick={() => navigate(`/users/${userId}/edit`)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Full Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.displayName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {user.phoneNumber || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Role
                </dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                    <Shield className="h-3 w-3 mr-1" />
                    {formatRoleName(user.role)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email Verified
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.isEmailVerified ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>

          {user.metadata && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Employment Details
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Employee ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.metadata.employeeId || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Department
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.metadata.department || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Designation
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.metadata.designation || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    License Number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.metadata.licenseNumber || '-'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Account Activity
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Login
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.lastLoginAt
                    ? format(user.lastLoginAt instanceof Date ? user.lastLoginAt : (user.lastLoginAt as any).toDate(), 'MMM d, yyyy h:mm a')
                    : 'Never'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created At
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {format(user.createdAt instanceof Date ? user.createdAt : (user.createdAt as any).toDate(), 'MMM d, yyyy')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Updated At
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {format(user.updatedAt instanceof Date ? user.updatedAt : (user.updatedAt as any).toDate(), 'MMM d, yyyy')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;