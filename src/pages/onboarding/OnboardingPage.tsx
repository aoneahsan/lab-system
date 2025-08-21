import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Users, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, isLoading } = useAuthStore();
  
  // Get initial option from URL
  const optionFromUrl = searchParams.get('option') as 'join' | 'create' | null;
  const [selectedOption, setSelectedOption] = useState<'join' | 'create' | null>(optionFromUrl);
  const [tenantCode, setTenantCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Update URL when option changes
  useEffect(() => {
    if (selectedOption) {
      setSearchParams({ option: selectedOption });
    } else {
      setSearchParams({});
    }
  }, [selectedOption, setSearchParams]);

  const handleJoinLaboratory = async () => {
    if (!tenantCode.trim()) {
      toast.error('Invalid code', 'Please enter a laboratory code');
      return;
    }

    setIsJoining(true);
    try {
      await useAuthStore.getState().joinLaboratory(tenantCode);
      toast.success('Joined successfully', 'Welcome to the laboratory!');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to join', 'Unable to join laboratory. Please check the code.');
    } finally {
      setIsJoining(false);
    }
  };


  // Use effect to handle navigation after component mounts
  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        navigate('/login');
      } else if (currentUser.tenantId) {
        navigate('/dashboard');
      }
    }
  }, [currentUser, isLoading, navigate]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If still loading or no user, don't render the page yet
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to LabFlow, {currentUser.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's get you set up with a laboratory
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {!selectedOption ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Choose how to get started
              </h2>

              <button
                onClick={() => setSelectedOption('join')}
                className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Users className="h-8 w-8 text-gray-400 group-hover:text-primary-500" />
                    <div className="text-left">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Join Existing Laboratory
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter a laboratory code to join an existing organization
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500" />
                </div>
              </button>

              <button
                onClick={() => setSelectedOption('create')}
                className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Building2 className="h-8 w-8 text-gray-400 group-hover:text-primary-500" />
                    <div className="text-left">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Create New Laboratory
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Set up a new laboratory organization
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500" />
                </div>
              </button>
            </div>
          ) : selectedOption === 'join' ? (
            <div>
              <button
                onClick={() => setSelectedOption(null)}
                className="mb-6 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back
              </button>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Join Existing Laboratory
              </h2>

              <form onSubmit={(e) => { e.preventDefault(); handleJoinLaboratory(); }} className="space-y-4">
                <div>
                  <label htmlFor="tenantCode" className="label">
                    Laboratory Code
                  </label>
                  <input
                    id="tenantCode"
                    type="text"
                    required
                    className="input"
                    value={tenantCode}
                    onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                    placeholder="Enter laboratory code (e.g., DEMO)"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Ask your laboratory administrator for the code
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full btn btn-primary"
                >
                  {isJoining ? 'Joining...' : 'Join Laboratory'}
                </button>
              </form>
            </div>
          ) : selectedOption === 'create' ? (
            <div>
              <button
                onClick={() => setSelectedOption(null)}
                className="mb-6 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back
              </button>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Create New Laboratory
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Set up your own laboratory organization. You'll be able to invite other users and manage all aspects of your laboratory.
              </p>

              <button
                onClick={() => navigate('/onboarding/setup-laboratory')}
                className="w-full btn btn-primary"
              >
                Continue to Setup
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;