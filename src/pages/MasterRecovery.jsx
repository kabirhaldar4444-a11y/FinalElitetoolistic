import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../utils/supabase';
import { useToast } from '../components/common/AlertProvider';

const MasterRecovery = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRecovery = async (e) => {
    e.preventDefault();

    if (email.trim().toLowerCase() !== 'kabirhaldar4444@gmail.com') {
      return toast('Only the Master Administrator can use this recovery portal.', 'error');
    }

    setLoading(true);
    try {
      const productionURL = 'https://elitetoolistic.vercel.app';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.hostname === 'localhost' ? productionURL : window.location.origin}/reset-password`,
      });


      if (error) throw error;

      toast('Recovery link sent to your master email!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Background decoration similar to Login */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-white">
        <div className="absolute top-[-5%] left-[-5%] w-[800px] h-[800px] bg-indigo-50/40 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[800px] h-[800px] bg-rose-50/40 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-6 py-12 bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] rounded-[2.5rem] animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 text-white rounded-2xl mb-6 shadow-xl shadow-slate-200">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M8 11h8" /><path d="M12 8v6" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Master Recovery</h1>
          <p className="text-slate-500 text-sm font-medium">Enter your administrative email to receive a secure recovery link.</p>
        </div>

        <form onSubmit={handleRecovery} className="space-y-6">
          <div className="group relative">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1 group-focus-within:text-indigo-600 transition-colors">
              Administrative Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Admin Email only"
              required
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all duration-300 font-medium text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-black active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span className="uppercase tracking-widest text-xs">Send Recovery Link</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                  <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-50 text-center">
          <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Secure Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MasterRecovery;
