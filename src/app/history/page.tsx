'use client';

import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, PenTool, Camera, CheckCircle, AlertCircle, Search, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MobileBottomNav } from '@/components/MobileBottomNav';

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

const isThisWeek = (date: Date) => {
  const today = new Date();
  const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return date >= firstDay && date <= lastDay;
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

type HistoryType = 'doubt' | 'test' | 'evaluation' | 'upload' | 'mistake';

interface HistoryItem {
  id: string;
  type: HistoryType;
  title: string;
  description?: string;
  chapter?: string;
  subject?: string;
  date: string;
  score?: string;
  percentage?: number;
  url: string;
}

const TYPE_CONFIG = {
  doubt: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Tutor Doubt' },
  test: { icon: PenTool, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Test Completed' },
  evaluation: { icon: CheckCircle, color: 'text-teal-500', bg: 'bg-teal-500/10', label: 'Answer Evaluation' },
  upload: { icon: Camera, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Uploaded Question' },
  mistake: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Mistake Book' },
};

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'doubt', label: 'Doubts' },
  { id: 'test', label: 'Tests' },
  { id: 'evaluation', label: 'Evaluations' },
  { id: 'upload', label: 'Uploads' },
];

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/history?limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.chapter?.toLowerCase().includes(query) ||
          item.subject?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [history, activeFilter, searchQuery]);

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {
      'Today': [],
      'Yesterday': [],
      'Earlier this week': [],
      'Earlier': []
    };

    filteredHistory.forEach(item => {
      const date = new Date(item.date);
      if (isToday(date)) groups['Today'].push(item);
      else if (isYesterday(date)) groups['Yesterday'].push(item);
      else if (isThisWeek(date)) groups['Earlier this week'].push(item);
      else groups['Earlier'].push(item);
    });

    return groups;
  }, [filteredHistory]);

  const renderEmptyState = () => {
    if (loading) return null;

    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Search className="w-12 h-12 text-foreground/20 mb-4" />
          <h3 className="text-xl font-bold mb-2">No results found</h3>
          <p className="text-foreground/60 max-w-sm">
            We couldn't find any history matching "{searchQuery}".
          </p>
        </div>
      );
    }

    const messages = {
      all: { title: "Your learning journey starts here.", btn: "Ask a Doubt", link: "/tutor" },
      doubt: { title: "No tutor doubts yet.", btn: "Ask a Doubt", link: "/tutor" },
      test: { title: "No tests yet.", btn: "Create a Test", link: "/custom-test" },
      evaluation: { title: "No answer evaluations yet.", btn: "Check My Answer", link: "/answer-evaluation" },
      upload: { title: "No uploads yet.", btn: "Ask a Doubt", link: "/tutor" },
    };

    const empty = messages[activeFilter as keyof typeof messages] || messages.all;

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-in fade-in zoom-in duration-300">
        <BookOpen className="w-16 h-16 text-primary-500/20 mb-6" />
        <h3 className="text-xl font-bold mb-6 text-foreground/80">{empty.title}</h3>
        <Link 
          href={empty.link}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all tap-scale shadow-sm"
        >
          {empty.btn}
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-card-border pt-4 sm:pt-8 pb-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit mb-1">History</h1>
          <p className="text-foreground/60 text-sm sm:text-base">Everything you've learned, practiced, and improved.</p>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="text"
              placeholder="Search your history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card-bg/50 border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-foreground/40"
            />
          </div>

          {/* Filters */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all tap-scale ${
                  activeFilter === filter.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-card-bg border border-card-border text-foreground/70 hover:text-foreground hover:bg-card-border'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
            <h3 className="text-xl font-bold mb-4">Couldn't load your history.</h3>
            <button 
              onClick={fetchHistory}
              className="bg-card-bg border border-card-border hover:bg-card-border text-foreground font-bold py-2.5 px-6 rounded-xl transition-all tap-scale"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredHistory.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {Object.entries(groupedHistory).map(([groupName, items]) => {
              if (items.length === 0) return null;
              
              return (
                <div key={groupName} className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider pl-1">
                    {groupName}
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.doubt;
                      const Icon = config.icon;
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => router.push(item.url)}
                          className="group relative bg-card-bg border border-card-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-primary-500/30 hover:shadow-md transition-all duration-300 overflow-hidden"
                        >
                          {/* Accent Gradient Line on Hover */}
                          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary-500 to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`shrink-0 p-3 rounded-xl ${config.bg} ${config.color}`}>
                              <Icon className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold ${config.color}`}>
                                  {config.label}
                                </span>
                                <span className="text-xs font-medium text-foreground/40">•</span>
                                <span className="text-xs font-medium text-foreground/50">
                                  {formatTime(new Date(item.date))}
                                </span>
                              </div>
                              
                              {item.description && (
                                <p className="text-sm sm:text-base font-medium text-foreground line-clamp-2 mb-1.5 leading-snug">
                                  {item.description}
                                </p>
                              )}
                              
                              {(item.subject || item.chapter) && (
                                <p className="text-xs text-foreground/60 truncate">
                                  {[item.subject, item.chapter].filter(Boolean).join(' • ')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right Side / Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pl-14 sm:pl-0 border-t border-card-border/50 sm:border-0 pt-3 sm:pt-0">
                            {item.score && (
                              <div className="flex flex-col sm:items-end">
                                <span className="text-sm font-bold bg-foreground/5 px-2.5 py-1 rounded-lg">
                                  {item.score}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary-500 group-hover:translate-x-1 transition-transform duration-300">
                              <span className="hidden sm:inline">View</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <MobileBottomNav />
    </div>
  );
}
