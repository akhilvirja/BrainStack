import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';

type AuthMode = 'signin' | 'register';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const authMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (mode === 'signin') {
        return await authService.login({ email: data.email, password: data.password });
      } else {
        return await authService.register({ username: data.username, email: data.email, password: data.password });
      }
    },
    onSuccess: (response) => {
      setAuth(response.meta.token, response.data);
      toast.success(mode === 'signin' ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Authentication failed:', error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || 'Authentication failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-md w-full mx-auto">
      {/* Soft Pill Tabs Switcher */}
      <div className="p-1 rounded-full bg-[#f2f3ef] border border-outline-variant/60 flex items-center mb-8">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 py-2 px-4 rounded-full font-headline font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'signin'
              ? 'text-white bg-sage shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <LogIn size={18} />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2 px-4 rounded-full font-headline font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'register'
              ? 'text-white bg-sage shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <UserPlus size={18} />
          <span>Create Account</span>
        </button>
      </div>

      {/* Dynamic Header */}
      <div className="mb-6">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
          {mode === 'signin' ? 'Welcome back' : 'Start building your Brain Stack'}
        </h2>
        <p className="font-body text-sm text-on-surface-variant mt-1.5">
          {mode === 'signin' 
            ? 'Enter your credentials to access your notes, graphs, and synced sources.'
            : 'Unlock a high-fidelity workspace for your knowledge, ideas, and bookmarks.'
          }
        </p>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-full h-px bg-outline-variant/50"></div>
        <span className="absolute px-3 bg-white font-label text-xs text-on-surface-variant uppercase tracking-wider">
          continue with email
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="AdaLovelace"
            icon={<User size={18} />}
            required
          />
        )}

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="name@company.com"
          icon={<Mail size={18} />}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••••••"
            icon={<Lock size={18} />}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-[34px] text-outline hover:text-on-surface focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {mode === 'signin' && (
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-outline-variant bg-[#f7f7f3] text-sage focus:ring-0 cursor-pointer accent-sage-dark" />
              <span className="font-body text-xs text-on-surface-variant">Remember me for 30 days</span>
            </label>
            <a href="#" className="font-label text-xs text-sage hover:text-spruce transition font-medium">
              Forgot password?
            </a>
          </div>
        )}

        <Button 
          type="submit" 
          fullWidth 
          icon={<ArrowRight size={18} />} 
          iconPosition="right"
          disabled={authMutation.isPending}
          className="mt-2"
        >
          {authMutation.isPending 
            ? 'Processing...' 
            : mode === 'signin' ? 'Sign In to Brain Stack' : 'Create Free Account'
          }
        </Button>
      </form>

      {/* Legal Disclaimer */}
      <div className="mt-8 text-center">
        <p className="font-label text-xs text-on-surface-variant">
          By proceeding, you agree to our{' '}
          <a href="#" className="text-sage hover:underline font-medium">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-sage hover:underline font-medium">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};
