import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

const RegisterPage = () => {
	const navigate = useNavigate();
	const { register, isLoading } = useAuthStore();
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phoneNumber: '',
		password: '',
		confirmPassword: '',
		tenantCode: '',
		acceptTerms: false,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (formData.password !== formData.confirmPassword) {
			toast.error('Password mismatch', 'Passwords do not match');
			return;
		}

		if (!formData.acceptTerms) {
			toast.error('Terms required', 'Please accept the terms and conditions');
			return;
		}

		try {
			await register({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName,
				lastName: formData.lastName,
				phoneNumber: formData.phoneNumber,
				tenantCode: formData.tenantCode,
			});

			toast.success('Registration successful', 'Welcome to LabFlow!');
			navigate('/dashboard');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unable to create account';
			toast.error('Registration failed', errorMessage);
		}
	};

	return (
		<div>
			<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
				Create your account
			</h2>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div className='grid grid-cols-2 gap-4'>
					<div>
						<label htmlFor='firstName' className='label'>
							First name
						</label>
						<input
							id='firstName'
							type='text'
							required
							className='input'
							value={formData.firstName}
							onChange={(e) =>
								setFormData({ ...formData, firstName: e.target.value })
							}
						/>
					</div>

					<div>
						<label htmlFor='lastName' className='label'>
							Last name
						</label>
						<input
							id='lastName'
							type='text'
							required
							className='input'
							value={formData.lastName}
							onChange={(e) =>
								setFormData({ ...formData, lastName: e.target.value })
							}
						/>
					</div>
				</div>

				<div>
					<label htmlFor='email' className='label'>
						Email address
					</label>
					<input
						id='email'
						type='email'
						required
						className='input'
						value={formData.email}
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
					/>
				</div>

				<div>
					<label htmlFor='phoneNumber' className='label'>
						Phone number (optional)
					</label>
					<input
						id='phoneNumber'
						type='tel'
						className='input'
						value={formData.phoneNumber}
						onChange={(e) =>
							setFormData({ ...formData, phoneNumber: e.target.value })
						}
					/>
				</div>

				<div>
					<label htmlFor='tenantCode' className='label'>
						Laboratory code
					</label>
					<input
						id='tenantCode'
						type='text'
						required
						className='input'
						value={formData.tenantCode}
						onChange={(e) =>
							setFormData({ ...formData, tenantCode: e.target.value })
						}
						placeholder='Enter your lab code'
					/>
				</div>

				<div>
					<label htmlFor='password' className='label'>
						Password
					</label>
					<input
						id='password'
						type='password'
						required
						className='input'
						value={formData.password}
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
						minLength={8}
					/>
				</div>

				<div>
					<label htmlFor='confirmPassword' className='label'>
						Confirm password
					</label>
					<input
						id='confirmPassword'
						type='password'
						required
						className='input'
						value={formData.confirmPassword}
						onChange={(e) =>
							setFormData({ ...formData, confirmPassword: e.target.value })
						}
					/>
				</div>

				<div className='flex items-center'>
					<input
						id='acceptTerms'
						type='checkbox'
						className='rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700'
						checked={formData.acceptTerms}
						onChange={(e) =>
							setFormData({ ...formData, acceptTerms: e.target.checked })
						}
					/>
					<label
						htmlFor='acceptTerms'
						className='ml-2 text-sm text-gray-600 dark:text-gray-400'
					>
						I accept the{' '}
						<a
							href='#'
							className='text-primary-600 hover:text-primary-500 dark:text-primary-400'
						>
							terms and conditions
						</a>
					</label>
				</div>

				<button
					type='submit'
					disabled={isLoading}
					className='w-full btn btn-primary'
				>
					{isLoading ? (
						<span className='flex items-center justify-center'>
							<span className='loading-spinner mr-2'></span>
							Creating account...
						</span>
					) : (
						'Create account'
					)}
				</button>
			</form>

			<div className='mt-6 text-center'>
				<p className='text-sm text-gray-600 dark:text-gray-400'>
					Already have an account?{' '}
					<Link
						to='/login'
						className='font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400'
					>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
};

export default RegisterPage;
