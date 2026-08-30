'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Trash2, Bot, User, AlertCircle, Loader2, CheckCircle2, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { compressImage } from '@/lib/image';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: { base64: string, mimeType: string }[];
  imageContext?: any;
  misconception?: string;
  mistakeSaved?: boolean;
};

const MAX_IMAGES_PER_MESSAGE = 10;
const MAX_TOTAL_IMAGE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB compressed safety limit

export default function TutorPage() {
  const [user, setUser] = useState<any>('loading');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm RankUp Tutor. What are you stuck on today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<{ id: string, base64: string, mimeType: string, bytes: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('Science');
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShouldAutoScroll(isNearBottom);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedImages.length + files.length > MAX_IMAGES_PER_MESSAGE) {
      setError(`You can add up to ${MAX_IMAGES_PER_MESSAGE} images at a time.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsCompressing(true);
    setError(null);

    const newImages = [...selectedImages];
    let totalBytes = newImages.reduce((acc, img) => acc + img.bytes, 0);

    try {
      for (const file of files) {
        const { base64, mimeType } = await compressImage(file);
        const sizeInBytes = (base64.length * 3) / 4;
        
        if (totalBytes + sizeInBytes > MAX_TOTAL_IMAGE_BYTES) {
           throw new Error('These images are too large to send together. Please remove one or more images or choose smaller photos.');
        }
        
        totalBytes += sizeInBytes;
        newImages.push({
          id: (Date.now() + Math.random()).toString(),
          base64,
          mimeType,
          bytes: sizeInBytes
        });
      }
      setSelectedImages(newImages);
    } catch (err: any) {
      setError(err.message || 'Failed to process images');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (idToRemove: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get('prefill');
      if (prefill) {
        setInput(prefill);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() && selectedImages.length === 0) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      ...(selectedImages.length > 0 ? { images: selectedImages.map(i => ({ base64: i.base64, mimeType: i.mimeType })) } : {})
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);
    setError(null);
    
    setShouldAutoScroll(true);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.content,
            // Only send raw base64 images for the NEW message to save history payload limits
            ...(m.id === userMessage.id && m.images ? { images: m.images } : {}),
            imageContext: m.imageContext
          })),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      if (data.imageContext) {
        setMessages((prev) => prev.map(m => m.id === userMessage.id ? { ...m, imageContext: data.imageContext } : m));
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        ...(data.misconception ? { misconception: data.misconception, mistakeSaved: false } : {})
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !isCompressing) {
        handleSend();
      }
    }
  };

  const handleSaveMistake = async (msgId: string, misconception: string) => {
    try {
      const response = await fetch('/api/mistake-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: "Tutor interaction on " + subject,
          student_answer: "See misconception",
          correct_answer: "See Tutor explanation",
          chapter: subject,
          topic: "Tutor Chat",
          mistake_summary: misconception,
          source_type: 'tutor',
          source_id: msgId
        })
      });
      if (response.ok) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, mistakeSaved: true } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm RankUp Tutor. What are you stuck on today?",
      }
    ]);
    setError(null);
  };

  if (user === 'loading') {
     return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }
  
  if (!user) {
     return <AuthPrompt />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4 sm:p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-stone-900 dark:text-stone-100">RankUp Tutor</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">Let's work through it together.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-700 dark:text-stone-300 outline-none focus:border-teal-500"
          >
            <option>Science</option>
            <option>Mathematics</option>
            <option>English</option>
          </select>
          <button 
            onClick={clearChat}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
                  <Bot className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 ${
                msg.role === 'user' 
                  ? 'bg-teal-600 text-white rounded-br-sm shadow-sm' 
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-sm border border-stone-100 dark:border-stone-700 shadow-sm'
              }`}>
                {msg.imageContext && (!msg.images || msg.images.length === 0) && (
                   <div className="flex items-center gap-1.5 mb-2 text-teal-200 text-xs font-medium">
                     <CheckCircle2 className="w-3.5 h-3.5" />
                     <span>Image context reused</span>
                   </div>
                )}
                {msg.images && msg.images.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-3">
                    {msg.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10 backdrop-blur-sm">
                          {idx + 1}
                        </div>
                        <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`Attached content ${idx + 1}`} className="max-h-48 rounded-xl object-contain border border-teal-500/30" />
                      </div>
                    ))}
                  </div>
                )}
                {msg.imageContext && msg.images && msg.images.length > 0 && (
                   <div className="flex items-center gap-1.5 mt-2 text-teal-100 text-xs font-medium bg-teal-700/50 px-2 py-1.5 rounded-lg inline-flex">
                     <CheckCircle2 className="w-3.5 h-3.5" />
                     <span>{msg.images.length} image{msg.images.length > 1 ? 's' : ''} analyzed</span>
                   </div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="flex flex-col gap-2">
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_.math-display]:overflow-x-auto [&_.math-display]:overflow-y-hidden [&_.math-display]:py-2 [&_.math-display]:scrollbar-thin [&_.math-display]:scrollbar-thumb-stone-300 dark:[&_.math-display]:scrollbar-thumb-stone-600">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.misconception && (
                      <div className="mt-1 pt-2 border-t border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Misconception identified
                        </span>
                        <button
                          onClick={() => handleSaveMistake(msg.id, msg.misconception!)}
                          disabled={msg.mistakeSaved}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${msg.mistakeSaved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 shadow-sm'}`}
                        >
                          {msg.mistakeSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                          {msg.mistakeSaved ? 'Saved to Mistake Book' : 'Save to Mistake Book'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
                <Bot className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              </div>
              <div className="bg-stone-50 dark:bg-stone-800 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3 border border-stone-100 dark:border-stone-700 shadow-sm">
                <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
                <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">
                  {messages[messages.length - 1]?.images?.length || messages[messages.length - 1]?.imageContext ? 'Analyzing image...' : 'Thinking...'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              multiple
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-stone-400 hover:text-teal-600 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors shrink-0 flex flex-col items-center justify-center"
              title="Add photos"
            >
              <ImageIcon className="w-6 h-6 mb-0.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Photos</span>
            </button>
            <div className="flex-1 relative flex flex-col">
              {isCompressing ? (
                <div className="relative inline-flex mb-3 self-start px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 items-center gap-2">
                  <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
                  <span className="text-xs text-stone-500 font-medium">Optimizing images...</span>
                </div>
              ) : selectedImages.length > 0 ? (
                <div className="flex gap-3 mb-3 self-start overflow-x-auto max-w-full pb-2 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-stone-700 w-full pr-14">
                  {selectedImages.map((img, idx) => (
                    <div key={img.id} className="relative shrink-0 p-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm">
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10 backdrop-blur-sm">
                        {idx + 1}
                      </div>
                      <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`Preview ${idx + 1}`} className="h-16 w-auto rounded-lg object-contain" />
                      <button 
                        onClick={() => removeImage(img.id)} 
                        className="absolute -top-2 -right-2 bg-stone-900 dark:bg-stone-700 hover:bg-red-500 text-white rounded-full p-1 shadow-sm transition-colors z-10"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {selectedImages.length < MAX_IMAGES_PER_MESSAGE && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 h-[84px] w-[84px] flex flex-col items-center justify-center gap-1 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 transition-colors text-stone-500 dark:text-stone-400"
                    >
                       <span className="text-xl leading-none">+</span>
                       <span className="text-xs font-medium uppercase tracking-wider">Add</span>
                    </button>
                  )}
                </div>
              ) : null}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message RankUp Tutor..."
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 pr-14 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none overflow-hidden text-stone-900 dark:text-white transition-shadow"
                rows={1}
                style={{ minHeight: '52px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && selectedImages.length === 0) || isLoading || isCompressing}
                className="absolute right-2 bottom-2 p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-all shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="text-center mt-3">
            <span className="text-[11px] text-stone-400 font-medium">RankUp AI can make mistakes. Verify important facts.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
