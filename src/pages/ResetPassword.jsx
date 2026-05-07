import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import { useToast } from '../components/common/AlertProvider';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast('Invalid or expired recovery link.', 'error');
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      return toast('Password must be at least 6 characters.', 'error');
    }

    if (password !== confirmPassword) {
      return toast('Passwords do not match.', 'error');
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;

      toast('Security credentials updated successfully!', 'success');
      
      // Sign out to ensure they log in with new password
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-white">
        <div className="absolute top-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-emerald-50/40 rounded-full blur-[140px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-sky-50/40 rounded-full blur-[140px] opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-8 py-14 bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.15)] rounded-[3rem] animate-fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 text-white rounded-3xl mb-8 shadow-2xl shadow-emerald-100 rotate-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Reset Security Key</h1>
          <p className="text-slate-500 text-base font-medium">Please establish your new administrative credentials below.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="space-y-6">
            <div className="group relative">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 ml-1 group-focus-within:text-emerald-600 transition-colors">
                New Secure Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-6 py-4.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all duration-300 font-medium text-slate-900"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="group relative">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 ml-1 group-focus-within:text-emerald-600 transition-colors">
                Confirm Security Key
              </label>
              <input 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-6 py-4.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all duration-300 font-medium text-slate-900"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 group overflow-hidden relative"
          >
            {loading ? (
              <svg className="animate-spin h-6 w-6 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span className="uppercase tracking-[0.2em] text-[11px] font-black">Finalize Update</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
