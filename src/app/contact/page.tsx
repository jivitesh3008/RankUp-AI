'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail, Shield, FileText, Copy, Check } from 'lucide-react';

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('gokuisbest2010@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-10 font-sans">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100 tracking-tight mb-4">Contact & Support</h1>
        <p className="text-stone-500 dark:text-stone-400 text-lg">We're here to help with your privacy and account questions.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-3">Email Support</h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6 text-sm">
            For account issues, data export requests, or privacy concerns, please email our support team.
          </p>
          <div className="flex items-center gap-2">
            <div className="px-5 py-3 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl font-semibold text-sm border border-stone-200 dark:border-stone-700 select-all">
              gokuisbest2010@gmail.com
            </div>
            <button 
              onClick={handleCopy}
              className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-600 hover:text-teal-600 dark:text-stone-400 dark:hover:text-teal-400 rounded-xl border border-stone-200 dark:border-stone-700 transition-colors shrink-0"
              title="Copy email"
            >
              {copied ? <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-3">Legal Policies</h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6 text-sm">
            Review how we protect your data and the rules of using our educational platform.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Link href="/privacy" className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-medium text-sm hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700">
              <Shield className="w-4 h-4" /> Privacy Policy
            </Link>
            <Link href="/terms" className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-medium text-sm hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700">
              <FileText className="w-4 h-4" /> Terms of Service
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
