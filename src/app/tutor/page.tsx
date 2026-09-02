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
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);
  const [subject, setSubject] = useState('Science');
  const [conversationId, setConversationId] = useState<string | null>(null);
  
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
      
      if (data.user && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const convId = params.get('conversation');
        if (convId) {
          setConversationId(convId);
          const { data: pastMsgs } = await supabase
            .from('tutor_messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
            
          if (pastMsgs && pastMsgs.length > 0) {
            setMessages(pastMsgs.map(m => ({
              id: m.id,
              role: m.role === 'model' ? 'assistant' : 'user',
              content: m.content
            })));
          }
        }
      }
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
    setIsQuotaExhausted(false);
    
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
          conversationId,
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role === 'assistant' ? 'model' : m.role, 
            content: m.content,
            ...(m.id === userMessage.id && m.images ? { images: m.images } : {}),
            imageContext: m.imageContext
          })),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.errorType === 'QUOTA_EXHAUSTED') {
          setIsQuotaExhausted(true);
        }
        throw new Error(data.error || 'Something went wrong');
      }
      
      if (data.imageContext) {
        setMessages((prev) => prev.map(m => m.id === userMessage.id ? { ...m, imageContext: data.imageContext } : m));
      }
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
        window.history.replaceState({}, document.title, `${window.location.pathname}?conversation=${data.conversationId}`);
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
    setConversationId(null);
    window.history.replaceState({}, document.title, window.location.pathname);
    setError(null);
  };

  if (user === 'loading') {
     return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }
  
  if (!user) {
     return <AuthPrompt />;
  }

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto p-4 sm:p-6 w-full mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-outfit text-foreground">AI Tutor</h1>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-emerald-500/10 rounded-full border border-accent-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-accent-emerald-500 uppercase tracking-wider">Online</span>
            </div>
          </div>
          <p className="text-sm text-foreground/60 mt-1">Let's work through it together.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="bg-card-bg border border-card-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary-500 transition-colors"
          >
            <option>Science</option>
            <option>Mathematics</option>
            <option>English</option>
          </select>
          <button 
            onClick={clearChat}
            className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card-bg border border-card-border rounded-3xl flex flex-col overflow-hidden shadow-sm h-[600px] min-h-[60vh]">
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20 mt-1">
                  <Bot className="w-4 h-4 text-primary-500" />
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-br-sm shadow-sm' 
                  : 'bg-background text-foreground rounded-bl-sm border border-card-border shadow-sm'
              }`}>
                {msg.imageContext && (!msg.images || msg.images.length === 0) && (
                   <div className="flex items-center gap-1.5 mb-2 text-primary-200 text-xs font-medium">
                     <CheckCircle2 className="w-3.5 h-3.5" />
                     <span>Image context reused</span>
                   </div>
                )}
                {msg.images && msg.images.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {msg.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10 backdrop-blur-sm">
                          {idx + 1}
                        </div>
                        <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`Attached content ${idx + 1}`} className="max-h-48 rounded-xl object-contain border border-primary-500/30 bg-black/20" />
                      </div>
                    ))}
                  </div>
                )}
                {msg.imageContext && msg.images && msg.images.length > 0 && (
                   <div className="flex items-center gap-1.5 mt-2 text-primary-100 text-xs font-medium bg-primary-700/50 px-2 py-1.5 rounded-lg inline-flex">
                     <CheckCircle2 className="w-3.5 h-3.5" />
                     <span>{msg.images.length} image{msg.images.length > 1 ? 's' : ''} analyzed</span>
                   </div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="flex flex-col gap-2">
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_.math-display]:overflow-x-auto [&_.math-display]:overflow-y-hidden [&_.math-display]:py-2 [&_.math-display]:scrollbar-thin [&_.math-display]:scrollbar-thumb-card-border">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.misconception && (
                      <div className="mt-2 pt-3 border-t border-card-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs text-accent-amber-500 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Misconception identified
                        </span>
                        <button
                          onClick={() => handleSaveMistake(msg.id, msg.misconception!)}
                          disabled={msg.mistakeSaved}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors tap-scale ${msg.mistakeSaved ? 'bg-accent-emerald-500/10 text-accent-emerald-500 border border-accent-emerald-500/20' : 'bg-background hover:bg-card-border text-foreground border border-card-border shadow-sm'}`}
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
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20 mt-1">
                <Bot className="w-4 h-4 text-primary-500 animate-pulse" />
              </div>
              <div className="bg-background rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3 border border-card-border shadow-sm">
                <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                <span className="text-sm text-foreground/60 font-medium">
                  {messages[messages.length - 1]?.images?.length || messages[messages.length - 1]?.imageContext ? 'Analyzing image...' : 'Thinking...'}
                </span>
              </div>
            </div>
          )}

          {isQuotaExhausted ? (
            <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20 mt-1">
                  <Bot className="w-4 h-4 text-primary-500" />
               </div>
               <div className="bg-red-500/10 border border-red-500/20 rounded-2xl rounded-bl-sm p-4 shadow-sm max-w-sm">
                  <div className="flex items-center gap-2 mb-2 text-red-500 font-semibold">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="text-sm">AI limit reached</h3>
                  </div>
                  <p className="text-xs text-red-400 leading-relaxed">
                    RankUp has reached its current AI usage limit. Please try again later.
                  </p>
               </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-background border-t border-card-border">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
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
              className="p-3 text-foreground/40 hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-colors shrink-0 flex items-center justify-center tap-scale h-[48px]"
              title="Add photos"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 relative flex flex-col">
              {isCompressing ? (
                <div className="relative inline-flex mb-2 self-start px-3 py-1.5 bg-card-bg rounded-lg border border-card-border items-center gap-2">
                  <Loader2 className="w-3 h-3 text-primary-500 animate-spin" />
                  <span className="text-xs text-foreground/60 font-medium">Optimizing...</span>
                </div>
              ) : selectedImages.length > 0 ? (
                <div className="flex gap-2 mb-2 self-start overflow-x-auto max-w-full pb-1 scrollbar-thin w-full pr-14">
                  {selectedImages.map((img, idx) => (
                    <div key={img.id} className="relative shrink-0 p-1.5 bg-card-bg rounded-xl border border-card-border shadow-sm">
                      <div className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[9px] font-bold px-1 py-0.5 rounded z-10 backdrop-blur-sm">
                        {idx + 1}
                      </div>
                      <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`Preview ${idx + 1}`} className="h-12 w-auto rounded-md object-contain" />
                      <button 
                        onClick={() => removeImage(img.id)} 
                        className="absolute -top-1.5 -right-1.5 bg-background border border-card-border hover:bg-red-500 hover:border-red-500 hover:text-white text-foreground/60 rounded-full p-1 shadow-sm transition-colors z-10 tap-scale"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="relative flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isQuotaExhausted}
                  placeholder={isQuotaExhausted ? "Limit reached." : "Ask anything..."}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 pr-12 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none overflow-hidden text-foreground transition-shadow disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={isQuotaExhausted || (!input.trim() && selectedImages.length === 0) || isLoading || isCompressing}
                  className="absolute right-1.5 bottom-1.5 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-all shadow-sm tap-scale"
                >
                  <Send className="w-4 h-4 text-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
