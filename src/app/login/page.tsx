'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResendMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
         setError('Please verify your email address before logging in.');
      } else {
         setError(error.message);
      }
      setLoading(false);
      return;
    }

    router.push('/progress');
    router.refresh();
  };

  const handleResend = async () => {
    if (!email) {
      setResendError(true);
      setResendMessage('Enter your email address first.');
      return;
    }

    setResendLoading(true);
    setResendMessage(null);
    setResendError(false);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    setResendLoading(false);

    if (error) {
      setResendError(true);
      setResendMessage('We couldn\'t resend the email right now. Please try again in a moment.');
    } else {
      setResendError(false);
      setResendMessage('Verification email sent. Please check your inbox.');
      setResendCooldown(45);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BookOpen className="h-10 w-10 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold font-outfit tracking-tight text-stone-900 dark:text-stone-100">
          Welcome back
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-stone-900 py-8 px-4 shadow-sm border border-stone-200 dark:border-stone-800 sm:rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-3 placeholder-stone-400 dark:bg-stone-800 dark:text-white shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-sm transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-3 placeholder-stone-400 dark:bg-stone-800 dark:text-white shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-sm transition-shadow"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</div>
            )}

            {error === 'Please verify your email address before logging in.' && (
              <div className="mt-4 p-5 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
                <p className="text-sm text-stone-600 dark:text-stone-300 mb-3 text-center">Didn't receive the email?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || resendCooldown > 0}
                  className="w-full flex justify-center py-2.5 px-4 border border-teal-600 rounded-xl text-sm font-medium text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
                </button>
                {resendMessage && (
                  <p className={`mt-3 text-sm text-center ${resendError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl border border-transparent bg-teal-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200 dark:border-stone-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-stone-900 px-4 text-stone-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/signup"
                className="flex w-full justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 py-3 px-4 text-sm font-medium text-stone-700 dark:text-stone-300 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
