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

    const allowedEmails = ['kabirhaldar4444@gmail.com', 'support@elitetoolistic.com', 'karthikriyan7@gmail.com', 'info@elitetoolistic.com'];
    if (!allowedEmails.includes(email.trim().toLowerCase())) {
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] relative overflow-hidden font-sans">
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-slate-200/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-slate-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-10 py-10 bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] rounded-[3.5rem] border border-slate-50/50 transition-all duration-500">
        <div className="text-center mb-8">
          {/* Official Logo Container - Compact */}
          <div className="flex justify-center mb-8 transform transition-transform hover:scale-105 duration-500">
            <div className="w-32 h-auto p-3.5 bg-white rounded-[1.8rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100/50 relative">
              <img src="/logo_full.png" alt="Elitetoolistic" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-[2.2rem] leading-none font-[900] text-[#111827] tracking-tighter mb-4">
            Master Recovery
          </h1>
          <p className="text-slate-400 text-[0.9rem] font-medium leading-relaxed max-w-[280px] mx-auto">
            Enter your administrative email to receive a secure recovery link.
          </p>
        </div>

        <form onSubmit={handleRecovery} className="space-y-7">
          <div className="group relative">
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-3 ml-2 group-focus-within:text-[#111827] transition-colors">
              Administrative Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Admin Email only"
              required
              className="w-full px-8 py-4 bg-[#f9fafb] border border-transparent rounded-full focus:bg-white focus:ring-4 focus:ring-slate-50 focus:border-slate-100 focus:outline-none transition-all duration-300 font-bold text-[#111827] placeholder:text-slate-200 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111827] text-white font-black py-4 rounded-full shadow-2xl shadow-slate-100 hover:bg-black active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3.5 group relative overflow-hidden"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span className="uppercase tracking-[0.25em] text-[12px] font-black">Send Recovery Link</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-50 text-center">
          <Link to="/login" className="inline-flex items-center gap-2.5 text-[0.85rem] font-bold text-slate-300 hover:text-[#111827] transition-all duration-300 group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
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
