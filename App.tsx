
import React, { useState, useRef, useEffect } from 'react';
import { analyzeText } from './services/geminiService';
import { AnalysisState, HistoryItem, DetectionResult, User } from './types';
import { ResultCard } from './components/ResultCard';
import { AuthModal } from './components/AuthModal';
import { 
  ShieldCheck, Loader2, Eraser, Github, Languages, Info, 
  ExternalLink, Image as ImageIcon, X, Camera, ScanText, 
  History, Trash2, ChevronRight, FileText, Calendar, Sun, Moon,
  LogOut, User as UserIcon
} from 'lucide-react';

const MIN_WORDS = 2;
const MAX_CHARS = 50000;
const HISTORY_KEY = 'veritas_analysis_history';
const THEME_KEY = 'veritas_theme_preference';
const USER_KEY = 'veritas_user_session';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    error: null,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = inputText.length;

  // Handle Theme Toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Auth Handlers
  const handleAuth = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    setIsUserMenuOpen(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
        setState(s => ({ ...s, error: null }));
      }
    } catch (err) {
      setState(s => ({ ...s, error: 'Could not access camera. Please check your browser permissions.' }));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        setImage({
          data: base64,
          mimeType: 'image/jpeg',
          preview: dataUrl
        });
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setState(s => ({ ...s, error: 'Please select a valid image file.' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImage({
        data: base64,
        mimeType: file.type,
        preview: URL.createObjectURL(file)
      });
      setState(s => ({ ...s, error: null }));
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    const hasInput = inputText.trim().length > 0 || image !== null;
    
    if (!hasInput) {
      setState(s => ({ ...s, error: "Please provide text or an image to analyze." }));
      return;
    }

    if (!image && wordCount < MIN_WORDS) {
      setState(s => ({ ...s, error: `Please enter at least ${MIN_WORDS} words for analysis.` }));
      return;
    }

    setState({ isLoading: true, result: null, error: null });
    try {
      const result = await analyzeText(
        inputText || undefined, 
        image ? { data: image.data, mimeType: image.mimeType } : undefined
      );
      
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        result,
        inputSnippet: inputText ? inputText.slice(0, 100) + (inputText.length > 100 ? '...' : '') : 'Image Analysis Scan',
        inputType: image ? 'image' : 'text'
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
      
      setState({ isLoading: false, result, error: null });
    } catch (err) {
      setState({
        isLoading: false,
        result: null,
        error: "Our systems are busy. Please try again in a moment."
      });
    }
  };

  const handleClear = () => {
    setInputText('');
    setImage(null);
    setState({ isLoading: false, result: null, error: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopCamera();
  };

  const clearHistory = () => {
    if (confirm('Clear all analysis history?')) {
      setHistory([]);
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const viewHistoryItem = (item: HistoryItem) => {
    setState({ isLoading: false, result: item.result, error: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(ts);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 dark:selection:bg-indigo-900 transition-colors duration-300 dark:bg-slate-950">
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuth={handleAuth} 
      />

      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">AI Detector</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How it works</a>
            <a href="#" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
              API Docs <ExternalLink className="w-3 h-3" />
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : setIsAuthModalOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              >
                {user ? (
                  <>
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {user && isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-20 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
                    </div>
                    <button className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors mb-1">
                        Profile Settings
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Analyze Authenticity
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Advanced detection for text and images. Identify AI-generated patterns with high-precision neural analysis.
          </p>
        </div>

        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-500"></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {image && !isCameraOpen && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-900 shadow-sm bg-white dark:bg-slate-800">
                  <img src={image.preview} alt="Upload preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-slate-800/90 rounded-full text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 shadow-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Analysis Input Ready</h4>
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-400/80">Source: {image.mimeType === 'image/jpeg' && image.preview.startsWith('data:') ? 'Camera Snapshot' : 'Uploaded Image'}</p>
                </div>
              </div>
            )}

            <div className="relative">
              {isCameraOpen ? (
                <div className="relative w-full h-[400px] bg-black overflow-hidden flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/30 m-8 rounded-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500"></div>
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-bounce"></div>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button 
                      onClick={stopCamera}
                      className="px-6 py-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-sm hover:bg-white/20 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={captureImage}
                      className="w-16 h-16 bg-white rounded-full border-4 border-indigo-500 shadow-xl flex items-center justify-center group active:scale-90 transition-transform"
                    >
                      <div className="w-12 h-12 bg-white border-2 border-slate-200 rounded-full group-hover:bg-slate-50"></div>
                    </button>
                  </div>
                </div>
              ) : (
                <textarea
                  className="w-full min-h-[300px] p-8 text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none resize-none bg-transparent"
                  placeholder="Paste text, upload an image, or use camera to analyze content..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={MAX_CHARS}
                />
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 text-sm">
                <div className="flex items-center gap-1.5 font-medium">
                  <ScanText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-slate-600 dark:text-slate-400 font-bold">Smart Analysis</span>
                </div>
                {!isCameraOpen && (
                  <div className="flex items-center gap-1.5">
                    <span className={charCount > MAX_CHARS * 0.9 ? 'text-amber-500' : ''}>
                      {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                
                <button
                  onClick={startCamera}
                  disabled={isCameraOpen}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-30"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Camera</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCameraOpen}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-30"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
                
                <button
                  onClick={handleClear}
                  disabled={(!inputText && !image && !isCameraOpen) || state.isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold text-sm transition-all disabled:opacity-30"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                <button
                  onClick={handleAnalyze}
                  disabled={state.isLoading || isCameraOpen || (!image && wordCount < MIN_WORDS)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-indigo-600 dark:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-500 hover:shadow-indigo-200 dark:hover:shadow-none transition-all disabled:opacity-50 active:scale-95"
                >
                  {state.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {state.error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in fade-in zoom-in-95">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{state.error}</p>
          </div>
        )}

        <div className="space-y-12">
          {state.result && (
            <div id="latest-result" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Latest Analysis</h3>
                <button onClick={() => setState(s => ({ ...s, result: null }))} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Close View</button>
              </div>
              <ResultCard result={state.result} />
            </div>
          )}

          {history.length > 0 && (
            <section className="animate-in fade-in duration-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">Analysis History</h3>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] font-bold">
                    {history.length} ITEMS
                  </span>
                </div>
                <button 
                  onClick={clearHistory}
                  className="text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear History
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Snippet</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Score</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {history.map((item) => (
                        <tr 
                          key={item.id} 
                          onClick={() => viewHistoryItem(item)}
                          className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${item.inputType === 'image' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                                {item.inputType === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{item.inputType}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span className="text-xs font-medium">{formatDate(item.timestamp)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate italic font-medium">
                              "{item.inputSnippet}"
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.result.is_ai_generated === null ? (
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 rounded text-[10px] font-bold">N/A</span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${
                                  (item.result.ai_probability_percent || 0) > 60 ? 'bg-red-500 dark:bg-red-400' :
                                  (item.result.ai_probability_percent || 0) > 30 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-green-500 dark:bg-green-400'
                                }`}></div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.result.ai_probability_percent}%</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="text-white w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">AI Detector</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed text-sm">
                Empowering content creators and educators with transparent detection and OCR tools. Built for accuracy and ethics.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest mb-6">Tools</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Camera OCR</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">History Persistence</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Multilingual AI</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest mb-6">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Ethics Protocol</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Use</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              &copy; {new Date().getFullYear()AI Detector.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-slate-300 dark:text-slate-600 uppercase">Detection Systems Live</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
