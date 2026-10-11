import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';

type AuthMode = 'signin' | 'signup';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>(
    location.pathname.includes('register') ? 'signup' : 'signin'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
        return await authService.register({
          username: data.username || data.email.split('@')[0],
          email: data.email,
          password: data.password
        });
      }
    },
    onSuccess: (response) => {
      setAuth(response.meta.token, response.data);
      toast.success(mode === 'signin' ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const backendMessage = error.response?.data?.meta?.message;
      console.error('Authentication failed:', backendMessage || error.message);
      toast.error(backendMessage || 'Internal Server Error. Please try again Later.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSocialAuth = (provider: string) => {
    toast(`Sign in with ${provider} is coming soon!`, {
      icon: '🌿',
    });
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Please enter your work email first.');
    } else {
      toast.success(`Password reset link sent to ${formData.email}`);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      {/* Soft Pill Tabs Switcher */}
      <div className="p-1 rounded-full bg-[#f2f3ef] border border-outline-variant/60 flex items-center mb-8">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 py-2 px-4 rounded-full font-headline font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${mode === 'signin'
            ? 'text-white bg-[#52796f] shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'
            }`}
        >
          <LogIn size={18} />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 py-2 px-4 rounded-full font-headline font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${mode === 'signup'
            ? 'text-white bg-[#52796f] shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'
            }`}
        >
          <UserPlus size={18} />
          <span>Create Account</span>
        </button>
      </div>

      {/* Dynamic Header */}
      <div className="mb-6">
        <h2 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
          {mode === 'signin' ? 'Welcome back' : 'Start building your Brain Stack'}
        </h2>
        <p className="font-body text-sm text-on-surface-variant mt-1.5 leading-relaxed">
          {mode === 'signin'
            ? 'Enter your credentials to access your notes, graphs, and synced sources.'
            : 'Unlock a high-fidelity workspace for your knowledge, ideas, and bookmarks.'}
        </p>
      </div>

      {/* Social Auth Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleSocialAuth('Google')}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#f7f7f3] border border-outline-variant/70 hover:bg-[#eeeee9] text-on-surface font-label text-xs font-medium transition shadow-xs group cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialAuth('GitHub')}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#f7f7f3] border border-outline-variant/70 hover:bg-[#eeeee9] text-on-surface font-label text-xs font-medium transition shadow-xs group cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current text-on-surface shrink-0" viewBox="0 0 24 24">
            <path
              clipRule="evenodd"
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>GitHub</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-full h-px bg-outline-variant/50"></div>
        <span className="absolute px-3 bg-white font-label text-xs text-on-surface-variant uppercase tracking-wider">
          or continue with email
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name (Signup only) */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-xs font-semibold text-on-surface" htmlFor="input-name">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-3 text-outline pointer-events-none" />
              <input
                id="input-name"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Ada Lovelace"
                required
                className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-[#f7f7f3] border border-outline-variant/80 text-on-surface placeholder:text-outline/70 font-body text-sm focus:border-primary focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>
        )}

        {/* Work Email */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label text-xs font-semibold text-on-surface" htmlFor="input-email">
            Work Email
          </label>
          <div className="relative flex items-center">
            <Mail size={18} className="absolute left-3 text-outline pointer-events-none" />
            <input
              id="input-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@company.com"
              required
              className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-[#f7f7f3] border border-outline-variant/80 text-on-surface placeholder:text-outline/70 font-body text-sm focus:border-primary focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-label text-xs font-semibold text-on-surface" htmlFor="input-password">
              Password
            </label>
            {mode === 'signin' && (
              <a
                href="#forgot"
                onClick={handleForgotPassword}
                className="font-label text-xs text-primary hover:text-spruce transition font-medium cursor-pointer"
              >
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative flex items-center">
            <Lock size={18} className="absolute left-3 text-outline pointer-events-none" />
            <input
              id="input-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••••••"
              required
              className="w-full py-2.5 pl-10 pr-10 rounded-xl bg-[#f7f7f3] border border-outline-variant/80 text-on-surface placeholder:text-outline/70 font-body text-sm focus:border-primary focus:bg-white focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-outline hover:text-on-surface focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant bg-[#f7f7f3] text-primary focus:ring-0 cursor-pointer accent-[#52796f]"
            />
            <span className="font-body text-xs text-on-surface-variant">Remember me for 30 days</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={authMutation.isPending}
          className="mt-2 w-full py-3 px-4 rounded-xl bg-[#52796f] hover:bg-primary text-white font-headline font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {authMutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>{mode === 'signin' ? 'Sign In to Brain Stack' : 'Create Free Account'}</span>
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Legal Disclaimer */}
      <div className="mt-8 text-center">
        <p className="font-label text-xs text-on-surface-variant">
          By proceeding, you agree to our{' '}
          <a href="#" className="text-primary hover:underline font-medium">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary hover:underline font-medium">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};
