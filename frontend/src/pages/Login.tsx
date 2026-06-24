import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { Shield, Loader2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary">
          <Shield size={48} strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to BurnoutGuard
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-primary hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {mutation.isError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                Invalid credentials. Please try again.
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : 'Sign in'}
              </button>
            </div>
            
            {/* Quick Demo Logins for UI testing */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500 mb-3 text-center uppercase tracking-wider font-semibold">Demo Accounts (Password123!)</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setEmail('dev@burnoutguard.com'); setPassword('Password123!'); }} className="text-xs bg-slate-100 p-2 rounded text-slate-700 hover:bg-slate-200">Developer</button>
                <button type="button" onClick={() => { setEmail('manager@burnoutguard.com'); setPassword('Password123!'); }} className="text-xs bg-slate-100 p-2 rounded text-slate-700 hover:bg-slate-200">Manager</button>
                <button type="button" onClick={() => { setEmail('hr@burnoutguard.com'); setPassword('Password123!'); }} className="text-xs bg-slate-100 p-2 rounded text-slate-700 hover:bg-slate-200">HR Officer</button>
                <button type="button" onClick={() => { setEmail('admin@burnoutguard.com'); setPassword('Password123!'); }} className="text-xs bg-slate-100 p-2 rounded text-slate-700 hover:bg-slate-200">Admin</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
