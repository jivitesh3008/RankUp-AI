'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PageHeader({ title, backHref = '/' }: { title: string; backHref?: string }) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(backHref);
    }
  };

  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-card-border">
      <button 
        onClick={handleBack}
        className="p-2 -ml-2 rounded-xl hover:bg-card-border/50 text-foreground/70 hover:text-foreground transition-colors tap-scale"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-bold font-outfit text-foreground">{title}</h1>
    </div>
  );
}
