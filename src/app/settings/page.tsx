'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { Download, Trash2, Shield, Loader2, AlertTriangle, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>('loading');
  const [profile, setProfile] = useState<any>(null);
  
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    };
    fetchUser();
  }, []);

  const handleDownloadData = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch('/api/export-data');
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rankup_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during export.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
         const data = await response.json();
         throw new Error(data.error || 'Failed to delete account');
      }
      
      // Successfully deleted on server. Clear local session.
      const supabase = createClient();
      await supabase.auth.signOut();
      
      router.push('/login?deleted=true');
    } catch (err: any) {
      setError(err.message || 'Could not delete account. Please try again.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (user === 'loading') return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  if (!user) return <AuthPrompt />;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full font-sans mb-12 flex-1">
      <div className="mb-8">
        <PageHeader title="Profile Settings" backHref="/" />
        <p className="text-foreground/60 ml-[3.25rem] -mt-2">Manage your profile, data, and privacy preferences.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Profile Section */}
        <section className="bg-card-bg border border-card-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-card-border">
            <UserIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-bold font-outfit text-foreground">Account Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-bold text-foreground/50 mb-1 uppercase tracking-wider">Display Name</p>
              <p className="text-lg font-medium text-foreground">{profile?.display_name || 'Student'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/50 mb-1 uppercase tracking-wider">Email Address</p>
              <p className="text-lg font-medium text-foreground">{user.email}</p>
            </div>
          </div>
        </section>

        {/* Privacy & Data Section */}
        <section className="bg-card-bg border border-card-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-card-border">
            <Shield className="w-6 h-6 text-accent-amber-500" />
            <h2 className="text-xl font-bold font-outfit text-foreground">Privacy & Data Controls</h2>
          </div>
          
          <div className="space-y-8">
            
            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Policies</h3>
              <div className="flex gap-4">
                <Link href="/privacy" className="text-sm font-medium text-primary-500 hover:underline">Privacy Policy</Link>
                <Link href="/terms" className="text-sm font-medium text-primary-500 hover:underline">Terms of Service</Link>
              </div>
            </div>

            {/* Export */}
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Export Data</h3>
              <p className="text-sm text-foreground/60 mb-4">Download a copy of all your tests, evaluations, and mistakes stored on RankUp AI.</p>
              <button 
                onClick={handleDownloadData}
                disabled={downloading}
                className="flex items-center gap-2 px-5 py-2.5 bg-background hover:bg-card-border text-foreground rounded-xl text-sm font-bold transition-colors disabled:opacity-50 border border-card-border shadow-sm tap-scale"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? 'Preparing Export...' : 'Download My Data'}
              </button>
            </div>

            {/* Delete Account */}
            <div className="pt-6 border-t border-card-border">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">Danger Zone</h3>
              <p className="text-sm text-foreground/60 mb-4">
                Permanently delete your account and all associated educational data. This action is irreversible.
              </p>
              
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-background border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-sm font-bold transition-colors shadow-sm tap-scale"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              ) : (
                <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                  <p className="font-bold text-red-500 mb-2">Are you absolutely sure?</p>
                  <p className="text-sm text-red-400 mb-5">
                    This will permanently delete your profile, tests, mistake book, and all other activity.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm tap-scale"
                    >
                      {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Yes, delete everything
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="px-5 py-2.5 bg-background border border-card-border text-foreground rounded-xl text-sm font-bold hover:bg-card-bg transition-colors tap-scale"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </section>
      </div>
    </div>
  );
}
