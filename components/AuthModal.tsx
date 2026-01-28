
import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: User) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onAuth }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.email || !formData.password || (isSignUp && !formData.name)) {
        setError("Please fill in all fields");
        return;
    }

    setIsLoading(true);

    // Simulate API call authentication
    setTimeout(() => {
      setIsLoading(false);
      // Mock successful auth
      onAuth({
          id: crypto.randomUUID(),
          name: isSignUp ? formData.name : formData.email.split('@')[0],
          email: formData.email
      });
      onClose();
      // Reset form after closing
      setFormData({ name: '', email: '', password: '' });
      setIsSignUp(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {isSignUp ? 'Join Veritas for advanced analysis' : 'Sign in to access your history'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="email" 
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="password" 
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">{error}</p>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            {isSignUp ? 'Create Account' : 'Sign In'}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                        className="ml-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
