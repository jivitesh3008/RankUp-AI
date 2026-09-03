'use client';
import { useState, useEffect } from 'react';
import { Bot, ChevronRight, Loader2, Target } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [goal, setGoal] = useState('');

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile && !data.profile.onboarding_completed) {
            setProfile(data.profile);
            setName(data.profile.display_name || '');
            setIsOpen(true);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    checkOnboarding();
  }, []);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: name,
          primary_subject: subject,
          learning_goal: goal,
          onboarding_completed: true
        })
      });
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card-bg border border-card-border rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {step === 1 && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold font-outfit text-foreground mb-3">Welcome to RankUp AI</h2>
            <p className="text-foreground/60 mb-8 leading-relaxed">
              Before we get started, let's personalize your learning experience. It only takes a minute!
            </p>
            <div className="w-full text-left mb-6">
              <label className="block text-sm font-medium text-foreground/80 mb-2">What should we call you?</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 tap-scale disabled:opacity-50"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold font-outfit text-foreground">Your Focus</h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground/80 mb-3">Primary Subject</label>
              <div className="grid grid-cols-2 gap-3">
                {['Science', 'Mathematics'].map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setSubject(subj)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${subject === subj ? 'border-primary-500 bg-primary-500/10 text-primary-600' : 'border-card-border bg-background text-foreground/70 hover:border-card-border/80'}`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-foreground/80 mb-3">Your Goal</label>
              <div className="space-y-3">
                {['Improve my grades', 'Prepare for board exams', 'Clear my doubts', 'Just practicing'].map((g) => (
                  <label key={g} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${goal === g ? 'border-primary-500 bg-primary-500/5' : 'border-card-border bg-background hover:bg-card-border/30'}`}>
                    <input type="radio" name="goal" checked={goal === g} onChange={() => setGoal(g)} className="text-primary-600 focus:ring-primary-500" />
                    <span className={`text-sm ${goal === g ? 'text-foreground font-medium' : 'text-foreground/70'}`}>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 bg-card-border/50 hover:bg-card-border text-foreground rounded-xl font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!subject || !goal || isSaving}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 tap-scale disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Learning!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
