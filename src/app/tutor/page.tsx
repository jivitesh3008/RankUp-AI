'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Trash2, Bot, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  mimeType?: string;
  imageContext?: any;
};

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm RankUp Tutor. What are you stuck on today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('Mathematics');
  
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Original image is too large. Please select an image under 15MB.');
      e.target.value = '';
      return;
    }

    setIsCompressing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new window.Image();
      
      img.onload = () => {
        const MAX_DIMENSION = 2500;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Failed to process image. Please try another.');
          setIsCompressing(false);
          return;
        }

        let targetMime = file.type;
        if (targetMime === 'image/png') {
           ctx.fillStyle = '#ffffff';
           ctx.fillRect(0, 0, width, height);
           targetMime = 'image/jpeg';
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        const quality = 0.85;
        const compressedDataUrl = canvas.toDataURL(targetMime, quality);
        
        const sizeInBytes = (compressedDataUrl.length * 3) / 4;

        if (sizeInBytes > 5 * 1024 * 1024) {
           setError('Even after compression, the image is too large. Please choose a smaller image.');
           setIsCompressing(false);
           return;
        }

        const match = compressedDataUrl.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
        if (match) {
          setSelectedImageMime(match[1]);
          setSelectedImage(match[2]);
        } else {
          setError('Failed to compress image.');
        }
        setIsCompressing(false);
      };
      
      img.onerror = () => {
        setError('Invalid or corrupted image file.');
        setIsCompressing(false);
      };
      
      img.src = result;
    };
    
    reader.onerror = () => {
       setError('Failed to read file.');
       setIsCompressing(false);
    };
    
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get('prefill');
      if (prefill) {
        setInput(prefill);
        // Clean up URL so it doesn't persist on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      ...(selectedImage && selectedImageMime ? { image: selectedImage, mimeType: selectedImageMime } : {})
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setSelectedImageMime(null);
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
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.content,
            ...(m.id === userMessage.id ? { image: m.image, mimeType: m.mimeType } : {}),
            imageContext: m.imageContext
          })),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      if (data.imageContext) {
        // Update user message with processed image context
        setMessages((prev) => prev.map(m => m.id === userMessage.id ? { ...m, imageContext: data.imageContext } : m));
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4 sm:p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">RankUp Tutor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Let's solve it together.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
          >
            <option>Mathematics</option>
            <option>Science</option>
            <option>English</option>
          </select>
          <button 
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'
              }`}>
                {msg.imageContext && !msg.image && (
                   <div className="flex items-center gap-1.5 mb-2 text-indigo-200 text-xs font-medium">
                     <CheckCircle2 className="w-3.5 h-3.5" />
                     <span>Image context reused</span>
                   </div>
                )}
                {msg.image && (
                  <div className="mb-2">
                    <img src={`data:${msg.mimeType};base64,${msg.image}`} alt="Uploaded content" className="max-h-64 rounded-lg object-contain" />
                  </div>
                )}
                {msg.imageContext && msg.image && (
                   <div className="flex items-center gap-1.5 mt-2 text-indigo-200 text-xs font-medium bg-indigo-700/50 px-2 py-1.5 rounded-md inline-flex">
                     <CheckCircle2 className="w-3.5 h-3.5" />
                     <span>Image analyzed successfully</span>
                   </div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_.math-display]:overflow-x-auto [&_.math-display]:overflow-y-hidden [&_.math-display]:py-2 [&_.math-display]:scrollbar-thin [&_.math-display]:scrollbar-thumb-slate-300 dark:[&_.math-display]:scrollbar-thumb-slate-600">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {messages[messages.length - 1]?.image || messages[messages.length - 1]?.imageContext ? 'Analyzing image...' : 'Thinking...'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
              title="Upload image"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 relative flex flex-col">
              {isCompressing ? (
                <div className="relative inline-block mb-2 self-start p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Optimizing image...</span>
                </div>
              ) : selectedImage ? (
                <div className="relative inline-block mb-2 self-start p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Image ready</span>
                  </div>
                  <img src={`data:${selectedImageMime};base64,${selectedImage}`} alt="Preview" className="h-20 w-auto rounded-md object-contain" />
                  <button 
                    onClick={() => { setSelectedImage(null); setSelectedImageMime(null); }} 
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question here... (e.g. I don't understand Ohm's Law)"
                className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-4 py-3 sm:py-4 pr-12 focus:ring-2 focus:ring-indigo-500 outline-none resize-none overflow-hidden text-slate-900 dark:text-white"
                rows={1}
                style={{ minHeight: '52px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isLoading || isCompressing}
                className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            RankUp AI can make mistakes. Always verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
