import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { EmailField } from '@/components/form-fields';

const ForgotPasswordPage = () => {
  const { resetPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await resetPassword(email);
      setIsSubmitted(true);
      toast.success('Email sent', 'Check your email for password reset instructions');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to send reset email';
      toast.error('Reset failed', errorMessage);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Check your email</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We've sent password reset instructions to <strong>{email}</strong>
        </p>
        <Link to="/login" className="btn btn-primary">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reset your password</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <button type="submit" disabled={isLoading} className="w-full btn btn-primary">
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="loading-spinner mr-2"></span>
              Sending email...
            </span>
          ) : (
            'Send reset email'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
