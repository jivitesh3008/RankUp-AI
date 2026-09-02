'use client';
import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Upload, SearchCheck, ArrowRight, Lightbulb, Settings2, FileText, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { compressImage } from '@/lib/image';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function AnswerEvaluationPage() {
  const [user, setUser] = useState<any>('loading');
  const [questionText, setQuestionText] = useState('');
  const [maxMarks, setMaxMarks] = useState('5');
  const [customMarks, setCustomMarks] = useState('');
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setError(null);
    setEvaluation(null);

    try {
      const { base64, mimeType } = await compressImage(file);
      setSelectedImage(base64);
      setSelectedImageMime(mimeType);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEvaluate = async () => {
    if (!selectedImage && !questionText.trim()) {
      setError('Please provide an image or enter the question.');
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setEvaluation(null);

    const marks = maxMarks === 'custom' ? customMarks : maxMarks;

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: questionText.trim(),
          maxMarks: marks,
          image: selectedImage,
          mimeType: selectedImageMime
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate answer');
      }

      setEvaluation(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during evaluation.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getSocraticPrefill = () => {
    if (!evaluation) return '';
    const text = `I need help improving my answer for this question:
${evaluation.questionText}

My answer was:
${evaluation.answerText}

The AI evaluation said I made these mistakes / missed these steps:
${[...(evaluation.evaluation.mistakes || []), ...(evaluation.evaluation.missingSteps || [])].join('\n')}

Can you guide me on how to fix this step-by-step?`;
    
    return encodeURIComponent(text);
  };

  if (user === 'loading') {
     return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }
  
  if (!user) {
     return <AuthPrompt />;
  }

  const SelectionButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button 
      onClick={onClick} 
      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${active ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-900/30 dark:border-teal-500/50 dark:text-teal-300' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 dark:bg-stone-800/50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full mb-8">
      <div className="mb-8">
        <PageHeader title="Check My Answer" backHref="/" />
        <p className="text-foreground/60 ml-[3.25rem] -mt-2">Upload your handwritten answer and get AI feedback to improve.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* INPUT SECTION */}
        <div className="space-y-6">
          <div className="bg-card-bg p-6 rounded-3xl border border-card-border shadow-sm">
            <h2 className="text-base font-semibold font-outfit text-foreground mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-foreground/40" />
              1. Answer Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-2 uppercase tracking-wider">Question (Optional if in image)</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Type the question here..."
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-500 outline-none resize-y min-h-[100px] text-foreground text-sm shadow-sm transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-2 uppercase tracking-wider">Maximum Marks</label>
                <div className="flex flex-wrap bg-background border border-card-border p-1 rounded-xl">
                  {['1', '2', '3', '4', '5'].map((mark) => (
                    <button
                      key={mark}
                      type="button"
                      onClick={() => setMaxMarks(mark)}
                      className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 ${
                        maxMarks === mark
                          ? 'bg-card-bg shadow-sm text-foreground' 
                          : 'text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      {mark}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMaxMarks('custom')}
                    className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 ${
                      maxMarks === 'custom'
                        ? 'bg-card-bg shadow-sm text-foreground' 
                        : 'text-foreground/60 hover:text-foreground'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {maxMarks === 'custom' && (
                  <input
                    type="number"
                    value={customMarks}
                    onChange={(e) => setCustomMarks(e.target.value)}
                    placeholder="Enter marks"
                    className="mt-3 w-full max-w-[150px] bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none text-foreground shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-card-bg p-6 rounded-3xl border border-card-border shadow-sm">
            <h2 className="text-base font-semibold font-outfit text-foreground mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-foreground/40" />
              2. Upload Answer
            </h2>
            
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
            />
            
            {!selectedImage && !isCompressing && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-card-border rounded-2xl p-8 hover:bg-card-border/50 hover:border-primary-500/50 transition-all text-foreground/50 tap-scale"
              >
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-card-border shadow-sm">
                   <Upload className="w-5 h-5 text-foreground/60" />
                </div>
                <span className="text-sm font-medium">Click to choose image</span>
              </button>
            )}

            {isCompressing && (
              <div className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-card-border rounded-2xl p-8 text-primary-500 bg-primary-500/5">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Optimizing image...</span>
              </div>
            )}

            {selectedImage && !isCompressing && (
              <div className="relative rounded-2xl overflow-hidden border border-card-border bg-background p-2 shadow-sm">
                <img src={`data:${selectedImageMime};base64,${selectedImage}`} alt="Answer preview" className="w-full h-auto object-contain max-h-[300px] rounded-xl border border-card-border" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors tap-scale"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleEvaluate}
            disabled={!selectedImage || isEvaluating || isCompressing}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-primary-500/20 transition-all tap-scale text-lg"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <SearchCheck className="w-5 h-5" />
                <span>Evaluate Answer ✨</span>
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl text-sm border border-red-500/20">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        <div>
          {evaluation ? (
             <div className="bg-card-bg p-6 sm:p-8 rounded-3xl border border-primary-500/30 shadow-sm sticky top-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-start justify-between mb-8">
                 <div>
                   <h2 className="text-2xl font-bold font-outfit text-foreground">Evaluation</h2>
                   <div className="flex flex-wrap items-center gap-2 mt-2">
                     <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                       evaluation.evaluation.confidence === 'High' ? 'bg-accent-emerald-500/10 text-accent-emerald-500 border border-accent-emerald-500/20' :
                       evaluation.evaluation.confidence === 'Low' ? 'bg-accent-amber-500/10 text-accent-amber-500 border border-accent-amber-500/20' :
                       'bg-background text-foreground/60 border border-card-border'
                     }`}>
                       Confidence: {evaluation.evaluation.confidence}
                     </span>
                     <span className="text-xs text-foreground/60 font-bold bg-background px-2.5 py-1 rounded-md border border-card-border">
                       {evaluation.topic}
                     </span>
                   </div>
                 </div>
                 <div className="bg-primary-500/10 border border-primary-500/20 px-5 py-3 rounded-xl text-center min-w-[90px]">
                   <div className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1">Score</div>
                   <div className="text-3xl font-bold font-outfit text-primary-400">
                     {evaluation.evaluation.estimatedMarks !== null ? evaluation.evaluation.estimatedMarks : '-'} 
                     <span className="text-lg font-normal text-primary-500/50"> / {maxMarks === 'custom' ? customMarks : maxMarks}</span>
                   </div>
                 </div>
               </div>

               <div className="space-y-6">
                 {evaluation.evaluation.strengths && evaluation.evaluation.strengths.length > 0 && (
                   <div>
                     <h3 className="text-sm font-bold text-accent-emerald-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                       <CheckCircle className="w-4 h-4" /> What you did well
                     </h3>
                     <ul className="space-y-2.5">
                       {evaluation.evaluation.strengths.map((item: string, i: number) => (
                         <li key={i} className="text-sm text-foreground flex items-start gap-3 bg-accent-emerald-500/10 p-4 rounded-xl border border-accent-emerald-500/20">
                           <span className="text-accent-emerald-500 mt-0.5">•</span>
                           <span className="leading-relaxed">{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {(evaluation.evaluation.mistakes?.length > 0 || evaluation.evaluation.missingSteps?.length > 0) && (
                   <div>
                     <h3 className="text-sm font-bold text-accent-amber-500 uppercase tracking-wider flex items-center gap-2 mb-3 mt-6">
                       <AlertCircle className="w-4 h-4" /> What you missed
                     </h3>
                     <ul className="space-y-2.5">
                       {evaluation.evaluation.mistakes?.map((item: string, i: number) => (
                         <li key={`mistake-${i}`} className="text-sm text-foreground flex items-start gap-3 bg-accent-amber-500/10 p-4 rounded-xl border border-accent-amber-500/20">
                           <span className="text-accent-amber-500 mt-0.5">⚠️</span>
                           <span className="leading-relaxed">{item}</span>
                         </li>
                       ))}
                       {evaluation.evaluation.missingSteps?.map((item: string, i: number) => (
                         <li key={`missing-${i}`} className="text-sm text-foreground flex items-start gap-3 bg-accent-amber-500/10 p-4 rounded-xl border border-accent-amber-500/20">
                           <span className="text-accent-amber-500 mt-0.5">⚠️</span>
                           <span className="leading-relaxed">{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {evaluation.evaluation.improvementTips && evaluation.evaluation.improvementTips.length > 0 && (
                   <div className="bg-background rounded-xl p-5 border border-card-border mt-6 shadow-sm">
                     <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
                       <Lightbulb className="w-4 h-4 text-accent-amber-500" /> How to improve
                     </h3>
                     <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                       {evaluation.evaluation.improvementTips.join(' ')}
                     </p>
                   </div>
                 )}
               </div>

               <div className="mt-8 pt-6 border-t border-card-border">
                 <Link 
                   href={`/tutor?prefill=${getSocraticPrefill()}`}
                   className="w-full flex items-center justify-center gap-2 bg-background hover:bg-card-border text-foreground font-bold py-4 px-4 rounded-xl transition-colors border border-card-border shadow-sm tap-scale"
                 >
                   <span>Help me improve this answer</span>
                   <ArrowRight className="w-4 h-4 text-foreground/50" />
                 </Link>
               </div>

             </div>
          ) : (
            <div className="bg-card-bg/50 rounded-3xl border border-dashed border-card-border h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
               <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-card-border">
                 <SearchCheck className="w-8 h-8 text-foreground/40" />
               </div>
               <h3 className="text-lg font-medium font-outfit text-foreground mb-2">Ready to evaluate</h3>
               <p className="text-sm text-foreground/50 max-w-xs">
                 Fill out the details and upload your answer to get an AI-estimated evaluation based on NCERT standards.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
