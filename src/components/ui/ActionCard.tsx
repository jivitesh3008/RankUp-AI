import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface ActionCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  accent: 'blue' | 'teal' | 'amber' | 'emerald';
}

export function ActionCard({ href, icon, title, description, accent }: ActionCardProps) {
  const accentClasses = {
    blue: 'bg-primary-50/50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-500 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40',
    teal: 'bg-accent-teal-400/10 dark:bg-accent-teal-900/20 text-accent-teal-600 dark:text-accent-teal-400 group-hover:bg-accent-teal-400/20 dark:group-hover:bg-accent-teal-900/40',
    amber: 'bg-accent-amber-400/10 dark:bg-accent-amber-900/20 text-accent-amber-600 dark:text-accent-amber-400 group-hover:bg-accent-amber-400/20 dark:group-hover:bg-accent-amber-900/40',
    emerald: 'bg-accent-emerald-400/10 dark:bg-accent-emerald-900/20 text-accent-emerald-600 dark:text-accent-emerald-400 group-hover:bg-accent-emerald-400/20 dark:group-hover:bg-accent-emerald-900/40',
  };

  return (
    <Link 
      href={href} 
      className="group block bg-card-bg border border-card-border p-5 rounded-2xl tap-scale hover-card relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors mb-4 ${accentClasses[accent]}`}>
          {icon}
        </div>
        <div className="text-foreground/20 group-hover:text-foreground/50 transition-colors group-hover:translate-x-1 duration-300">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-foreground/60 text-sm mt-1">{description}</p>
    </Link>
  );
}
