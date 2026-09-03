'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, PenTool, Activity, User, BookOpen } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Tutor', href: '/tutor', icon: MessageSquare },
    { name: 'Tests', href: '/custom-test', icon: PenTool },
    { name: 'Progress', href: '/progress', icon: Activity },
    { name: 'Notes', href: '/notes', icon: BookOpen },
    { name: 'Profile', href: '/settings', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-bottom-nav pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 tap-scale ${
                isActive ? 'text-primary-500' : 'text-foreground/50 hover:text-foreground/80'
              }`}
            >
              <div className={`p-1 rounded-full transition-colors duration-200 ${isActive ? 'bg-primary-500/10' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'fill-primary-500/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
