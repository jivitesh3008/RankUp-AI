'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserCircle, LogOut } from 'lucide-react';
import Image from 'next/image';
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
    <nav className="hidden md:flex flex-col w-64 border-r border-card-border bg-card-bg/50 shrink-0 sticky top-0 h-screen overflow-y-auto">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image src="/logo.png" alt="RankUp AI Logo" width={40} height={40} className="object-contain h-8 w-auto" priority />
          <span className="text-xl font-bold text-foreground font-outfit">RankUp AI</span>
        </Link>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all tap-scale ${
                isActive
                  ? 'bg-primary-500/10 text-primary-500'
                  : 'text-foreground/60 hover:text-foreground hover:bg-card-border'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-card-border mt-auto">
        {user ? (
           <div className="flex items-center justify-between">
              <Link href="/settings" className="flex items-center gap-3 text-sm font-bold text-foreground/80 hover:text-primary-500 transition-colors p-2 rounded-xl hover:bg-card-border flex-1" title="Account Settings">
                 <UserCircle className="h-8 w-8 text-foreground/40" />
                 <span className="truncate">{user.user_metadata?.full_name || 'Student'}</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-foreground/40 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-colors tap-scale shrink-0"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
           </div>
        ) : (
           <div className="space-y-3">
              <Link href="/login" className="flex items-center justify-center w-full text-sm font-bold text-foreground/70 hover:text-foreground px-3 py-2.5 rounded-xl hover:bg-card-border transition-colors tap-scale">
                 Log in
              </Link>
              <Link href="/signup" className="flex items-center justify-center w-full text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm tap-scale">
                 Sign up
              </Link>
           </div>
        )}
      </div>
    </nav>
  );
}
