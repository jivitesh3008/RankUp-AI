'use client';
import { useState, useEffect } from 'react';
import { Bookmark, MessageSquare, PenTool, CheckCircle2, Search, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function SavedPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/bookmarks');
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setBookmarks(prev => prev.filter(b => b.id !== id));
      await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'tutor_response': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'test_question': return <PenTool className="w-4 h-4 text-orange-500" />;
      case 'evaluation': return <CheckCircle2 className="w-4 h-4 text-teal-500" />;
      default: return <Bookmark className="w-4 h-4 text-stone-500" />;
    }
  };

  const getHref = (bookmark: any) => {
    switch (bookmark.item_type) {
      case 'tutor_response': return `/tutor?conversation=${bookmark.item_id}`;
      case 'test_question': return `/custom-test`; // ideally points to specific test if available
      case 'evaluation': return `/answer-evaluation/result/${bookmark.item_id}`;
      default: return '#';
    }
  };

  const filteredBookmarks = bookmarks.filter(b => {
    if (filter !== 'All') {
      if (filter === 'Tutor' && b.item_type !== 'tutor_response') return false;
      if (filter === 'Tests' && b.item_type !== 'test_question') return false;
      if (filter === 'Evaluations' && b.item_type !== 'evaluation') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!b.title.toLowerCase().includes(q) && !(b.preview || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full font-sans mb-8">
      <div className="mb-8">
         <PageHeader title="Saved" backHref="/" />
         <p className="text-foreground/60 -mt-2 ml-[3.25rem]">Keep the things worth revisiting.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card-bg border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-primary-500 outline-none transition-colors shadow-sm"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-thin">
          {['All', 'Tutor', 'Tests', 'Evaluations'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors tap-scale shadow-sm ${
                filter === f 
                  ? 'bg-foreground text-background' 
                  : 'bg-card-bg border border-card-border text-foreground hover:bg-card-border/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-foreground/50 text-sm">Loading...</div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="bg-card-bg border border-dashed border-card-border rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-card-border/50 rounded-full flex items-center justify-center mb-4">
             <Bookmark className="w-8 h-8 text-foreground/40" />
          </div>
          <h3 className="text-lg font-bold font-outfit text-foreground mb-2">Nothing saved yet.</h3>
          <p className="text-foreground/60 max-w-sm mb-6">
            When you find a useful explanation or a tricky question, click the bookmark icon to save it here for quick revision.
          </p>
          <Link href="/tutor" className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors tap-scale shadow-sm">
            Ask a Doubt
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map((bookmark) => (
            <Link 
              key={bookmark.id} 
              href={getHref(bookmark)}
              className="bg-card-bg border border-card-border rounded-2xl p-5 hover:border-primary-500/50 hover:shadow-md transition-all flex flex-col group block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-background rounded-lg border border-card-border">
                     {getIcon(bookmark.item_type)}
                   </div>
                   <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                     {bookmark.subject}
                   </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, bookmark.id)}
                  className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-base font-bold text-foreground mb-2 line-clamp-1">{bookmark.title}</h3>
              
              {bookmark.preview && (
                <p className="text-sm text-foreground/70 line-clamp-3 mb-4 flex-1">
                  {bookmark.preview}
                </p>
              )}
              
              <div className="mt-auto flex items-center justify-between text-xs font-medium border-t border-card-border pt-4">
                <span className="text-foreground/50">{new Date(bookmark.created_at).toLocaleDateString()}</span>
                <span className="text-primary-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View original <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
