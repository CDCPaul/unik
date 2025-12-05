'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Chrome, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement Firebase Google Auth
      // Check for @cebudirectclub.com domain
      console.log('Google login initiated');
      
      // Simulate login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to dashboard
      window.location.href = '/';
    } catch (err) {
      setError('Login failed. Only @cebudirectclub.com emails are allowed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            UNI<span className="text-yellow-400">K</span>
          </h1>
          <p className="text-slate-400">Admin Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Welcome back
          </h2>
          <p className="text-slate-500 mb-8">
            Sign in with your company Google account
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 
                     bg-white border-2 border-slate-200 rounded-xl
                     hover:bg-slate-50 hover:border-slate-300
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
            ) : (
              <Chrome className="w-5 h-5 text-slate-600" />
            )}
            <span className="font-medium text-slate-700">
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Only <span className="font-medium">@cebudirectclub.com</span> accounts are allowed
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Cebu Direct Club. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

