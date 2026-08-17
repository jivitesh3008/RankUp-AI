'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, Home, MessageSquare, UserCircle, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">RankUp AI</span>
            </Link>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>

            <Link href="/tutor" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Tutor
            </Link>
            
            <Link href="/custom-test" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium">
              Tests
            </Link>

            <Link href="/youtube-test" className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-2 text-sm font-medium flex items-center gap-2">
              YouTube Test
            </Link>

            <Link href="/progress" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium">
              Progress
            </Link>

            {user ? (
               <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                     <UserCircle className="h-5 w-5 text-slate-400" />
                     <span className="max-w-[100px] truncate">{user.user_metadata?.full_name || 'Student'}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-md"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
               </div>
            ) : (
               <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                     Log in
                  </Link>
                  <Link href="/signup" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors">
                     Sign up
                  </Link>
               </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
