'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, UserCircle, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
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

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Tutor', href: '/tutor' },
    { name: 'Tests', href: '/custom-test' },
    { name: 'Check Answer', href: '/answer-evaluation' },
    { name: 'Mistakes', href: '/mistake-book' },
    { name: 'Progress', href: '/progress' },
  ];

  return (
    <nav className="border-b bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-sm border-stone-200 dark:border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <BookOpen className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100 font-outfit">RankUp AI</span>
            </Link>
            
            <div className="hidden sm:flex sm:items-center sm:space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-stone-200/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center">
            {user ? (
               <div className="flex items-center gap-4 ml-4 pl-4 border-l border-stone-200 dark:border-stone-800">
                  <Link href="/settings" className="hidden sm:flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800" title="Account Settings">
                     <UserCircle className="h-5 w-5" />
                     <span className="max-w-[120px] truncate">{user.user_metadata?.full_name || 'Student'}</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
               </div>
            ) : (
               <div className="flex items-center gap-3 ml-4 pl-4 border-l border-stone-200 dark:border-stone-800">
                  <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                     Log in
                  </Link>
                  <Link href="/signup" className="text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
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
