'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BookOpen } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<boolean>(false);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.user?.identities?.length === 0) {
      setError('An account with this email already exists.');
      setLoading(false);
      return;
    }

    setMessage(true);
    setLoading(false);
  };

  const handleResend = async () => {
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
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-stone-900 py-8 px-4 shadow-sm border border-stone-200 dark:border-stone-800 sm:rounded-3xl sm:px-10">
          {message ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/20 mb-6">
                <span className="text-3xl">📩</span>
              </div>
              <h3 className="text-2xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-2">Check your email</h3>
              <p className="text-stone-600 dark:text-stone-400 mb-8">
                We've sent a verification link to:<br/>
                <span className="font-semibold text-stone-900 dark:text-stone-100 mt-1 block">{email}</span>
                <span className="block mt-4 text-sm">Please verify your email before logging in.</span>
              </p>
              
              <div className="space-y-4">
                <div className="pt-6 border-t border-stone-100 dark:border-stone-800">
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">Didn't receive the email?</p>
                  <button
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className="w-full flex justify-center py-2.5 px-4 border border-teal-600 rounded-xl text-sm font-medium text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
                  </button>
                  {resendMessage && (
                    <p className={`mt-3 text-sm ${resendError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <Link href="/login" className="inline-block text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300 transition-colors">
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSignup}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-3 placeholder-stone-400 dark:bg-stone-800 dark:text-white shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-sm transition-shadow"
                  />
                </div>
              </div>

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
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-3 placeholder-stone-400 dark:bg-stone-800 dark:text-white shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-sm transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-3 placeholder-stone-400 dark:bg-stone-800 dark:text-white shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-sm transition-shadow"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</div>
              )}

              <div className="pt-1">
                <p className="text-xs text-stone-500 dark:text-stone-400 text-center mb-4 leading-relaxed">
                  By creating an account, you agree to our <Link href="/terms" className="text-teal-600 dark:text-teal-400 hover:underline font-medium">Terms of Service</Link> and <Link href="/privacy" className="text-teal-600 dark:text-teal-400 hover:underline font-medium">Privacy Policy</Link>.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-xl border border-transparent bg-teal-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {!message && (
             <div className="mt-6 text-center text-sm">
               <span className="text-stone-500 dark:text-stone-400">Already have an account? </span>
               <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors">Log in</Link>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
