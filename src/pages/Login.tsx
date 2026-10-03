import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('demo@pocketsmart.ai');
  const [password, setPassword] = useState('Demo@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Check backend health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setBackendStatus('checking');
      const res = await api.get('/health', { timeout: 4000 });
      if (res.data?.status === 'healthy') {
        setBackendStatus('connected');
        if (error?.includes('Backend connection error')) {
          setError(null);
        }
      } else {
        setBackendStatus('connected');
      }
    } catch {
      setBackendStatus('disconnected');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.message === 'Network Error' || !err.response) {
        setError('Backend connection error. Please try again.');
        setBackendStatus('disconnected');
      } else {
        setError(err.response?.data?.message || err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillAndSubmit = async () => {
    setEmail('demo@pocketsmart.ai');
    setPassword('Demo@123');
    setError(null);
    setLoading(true);

    try {
      await login({ email: 'demo@pocketsmart.ai', password: 'Demo@123' });
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.message === 'Network Error' || !err.response) {
        // Retry health check
        await checkHealth();
        setError('Backend connection error. Please refresh the page or check your connection.');
      } else {
        setError(err.response?.data?.message || 'Login failed with demo credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-lg mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white">
              PocketSmart <span className="text-blue-400 font-bold">AI</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white text-center">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs text-slate-400 text-center">
            Sign in to access your financial dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0f172a]/90 backdrop-blur-md py-7 px-6 sm:px-8 rounded-2xl border border-slate-800/80 shadow-2xl">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {backendStatus === 'disconnected' && (
                  <button
                    type="button"
                    onClick={checkHealth}
                    className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-200 hover:text-white underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry connection check
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Demo Testing Box */}
          <div className="mb-5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-200">Quick Demo Testing</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">demo@pocketsmart.ai</div>
            </div>
            <button
              type="button"
              onClick={handleAutoFillAndSubmit}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Auto-fill
            </button>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative rounded-lg shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 active:scale-[0.99] shadow-lg shadow-indigo-900/30 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300 transition">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
