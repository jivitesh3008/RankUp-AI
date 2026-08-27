'use client';
import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Upload, SearchCheck, ArrowRight, Lightbulb, Settings2, FileText, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { compressImage } from '@/lib/image';
import Link from 'next/link';

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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-outfit text-stone-900 dark:text-stone-100 flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-teal-600" />
          Check My Answer
        </h1>
        <p className="text-stone-500 dark:text-stone-400">Upload your handwritten answer and get AI-estimated feedback to improve.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* INPUT SECTION */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <h2 className="text-base font-semibold font-outfit text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-stone-400" />
              1. Answer Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Question (Optional if in image)</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Type the question here..."
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none resize-y min-h-[100px] text-stone-900 dark:text-stone-100 text-sm shadow-sm transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Maximum Marks</label>
                <div className="flex flex-wrap gap-2">
                  {['1', '2', '3', '4', '5'].map((mark) => (
                    <SelectionButton key={mark} active={maxMarks === mark} onClick={() => setMaxMarks(mark)}>
                      {mark}
                    </SelectionButton>
                  ))}
                  <SelectionButton active={maxMarks === 'custom'} onClick={() => setMaxMarks('custom')}>
                    Custom
                  </SelectionButton>
                </div>
                {maxMarks === 'custom' && (
                  <input
                    type="number"
                    value={customMarks}
                    onChange={(e) => setCustomMarks(e.target.value)}
                    placeholder="Enter marks"
                    className="mt-3 w-full max-w-[150px] bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none text-stone-900 dark:text-stone-100 shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <h2 className="text-base font-semibold font-outfit text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-stone-400" />
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
                className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-8 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:border-teal-400 dark:hover:border-teal-600 transition-all text-stone-500 dark:text-stone-400"
              >
                <Upload className="w-8 h-8 text-stone-400" />
                <span className="text-sm font-medium">Click to choose image</span>
              </button>
            )}

            {isCompressing && (
              <div className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-8 text-teal-600 bg-teal-50 dark:bg-teal-900/20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Optimizing image...</span>
              </div>
            )}

            {selectedImage && !isCompressing && (
              <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-2 shadow-sm">
                <img src={`data:${selectedImageMime};base64,${selectedImage}`} alt="Answer preview" className="w-full h-auto object-contain max-h-[300px] rounded-lg border border-stone-200 dark:border-stone-700" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors border border-stone-200 dark:border-stone-700"
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
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 text-white font-medium py-4 px-4 rounded-xl shadow-sm transition-all"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <SearchCheck className="w-5 h-5" />
                <span>Evaluate Answer</span>
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        <div>
          {evaluation ? (
             <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-teal-200 dark:border-teal-900/50 shadow-sm sticky top-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-start justify-between mb-8">
                 <div>
                   <h2 className="text-2xl font-bold font-outfit text-stone-900 dark:text-stone-100">Evaluation</h2>
                   <div className="flex items-center gap-2 mt-2">
                     <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                       evaluation.evaluation.confidence === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' :
                       evaluation.evaluation.confidence === 'Low' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400' :
                       'bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400'
                     }`}>
                       Confidence: {evaluation.evaluation.confidence}
                     </span>
                     <span className="text-xs text-stone-500 dark:text-stone-400 font-medium bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md">
                       {evaluation.topic}
                     </span>
                   </div>
                 </div>
                 <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 px-5 py-3 rounded-xl text-center min-w-[90px]">
                   <div className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1">Score</div>
                   <div className="text-3xl font-bold font-outfit text-teal-800 dark:text-teal-300">
                     {evaluation.evaluation.estimatedMarks !== null ? evaluation.evaluation.estimatedMarks : '-'} 
                     <span className="text-lg font-normal text-teal-500 dark:text-teal-600"> / {maxMarks === 'custom' ? customMarks : maxMarks}</span>
                   </div>
                 </div>
               </div>

               <div className="space-y-6">
                 {evaluation.evaluation.strengths && evaluation.evaluation.strengths.length > 0 && (
                   <div>
                     <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                       <CheckCircle className="w-4 h-4" /> What you did well
                     </h3>
                     <ul className="space-y-2.5">
                       {evaluation.evaluation.strengths.map((item: string, i: number) => (
                         <li key={i} className="text-sm text-stone-700 dark:text-stone-300 flex items-start gap-3 bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100/50 dark:border-emerald-800/30">
                           <span className="text-emerald-500 mt-0.5">•</span>
                           <span className="leading-relaxed">{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {(evaluation.evaluation.mistakes?.length > 0 || evaluation.evaluation.missingSteps?.length > 0) && (
                   <div>
                     <h3 className="text-sm font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 mb-3 mt-6">
                       <AlertCircle className="w-4 h-4" /> What you missed
                     </h3>
                     <ul className="space-y-2.5">
                       {evaluation.evaluation.mistakes?.map((item: string, i: number) => (
                         <li key={`mistake-${i}`} className="text-sm text-stone-700 dark:text-stone-300 flex items-start gap-3 bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100/50 dark:border-amber-800/30">
                           <span className="text-amber-500 mt-0.5">⚠️</span>
                           <span className="leading-relaxed">{item}</span>
                         </li>
                       ))}
                       {evaluation.evaluation.missingSteps?.map((item: string, i: number) => (
                         <li key={`missing-${i}`} className="text-sm text-stone-700 dark:text-stone-300 flex items-start gap-3 bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100/50 dark:border-amber-800/30">
                           <span className="text-amber-500 mt-0.5">⚠️</span>
                           <span className="leading-relaxed">{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {evaluation.evaluation.improvementTips && evaluation.evaluation.improvementTips.length > 0 && (
                   <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700 mt-6">
                     <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-2 mb-2">
                       <Lightbulb className="w-4 h-4 text-amber-500" /> How to improve
                     </h3>
                     <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-2">
                       {evaluation.evaluation.improvementTips.join(' ')}
                     </p>
                   </div>
                 )}
               </div>

               <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                 <Link 
                   href={`/tutor?prefill=${getSocraticPrefill()}`}
                   className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-medium py-3 px-4 rounded-xl transition-colors border border-stone-200 dark:border-stone-700 shadow-sm"
                 >
                   <span>Help me improve this answer</span>
                   <ArrowRight className="w-4 h-4 text-stone-500" />
                 </Link>
               </div>

             </div>
          ) : (
            <div className="bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
               <div className="w-16 h-16 bg-white dark:bg-stone-900 rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-stone-100 dark:border-stone-800">
                 <SearchCheck className="w-8 h-8 text-stone-400 dark:text-stone-500" />
               </div>
               <h3 className="text-lg font-medium font-outfit text-stone-700 dark:text-stone-300 mb-2">Ready to evaluate</h3>
               <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
                 Fill out the details and upload your answer to get an AI-estimated evaluation based on NCERT standards.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
