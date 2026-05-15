import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../utils/supabase';
import { useToast } from '../components/common/AlertProvider';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const emailToAuth = email.trim().toLowerCase();
    const passwordToAuth = password;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: passwordToAuth
      });

      if (error) throw error;
      const user = data.user;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, profile_completed, full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error('Database access error. Account initialization incomplete.');
      }

      if (user.email === 'kabirhaldar4444@gmail.com' || user.email === 'support@elitetoolistic.com' || profile.role === 'admin') {
        await onLoginSuccess();
        toast('Access Granted: Administrator Session Initialized', 'success');
        navigate('/admin');
        return;
      }

      if (profile.role === 'candidate') {
        await onLoginSuccess();
        toast(`Welcome back, ${profile.full_name || 'Candidate'}`, 'success');
        navigate(profile.profile_completed ? '/' : '/complete-profile');
      } else {
        await supabase.auth.signOut();
        throw new Error('Access restricted. Please contact administrator.');
      }
    } catch (err) {
      toast(err.message === 'Invalid login credentials' ? 'Invalid credentials. Please verify your email and password.' : err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100">
      
      {/* ── LIGHT PLEASANT PREMIUM ATMOSPHERE ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-white">
        {/* Deep Light Foundations */}
        <div className="absolute top-[-5%] left-[-5%] w-[800px] h-[800px] bg-rose-50/40 rounded-full blur-[120px] animate-drift-right opacity-50" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[800px] h-[800px] bg-sky-50/40 rounded-full blur-[120px] animate-drift-left opacity-50" />
        
        {/* Light Pastel Micro-Orbs (Unified Size) */}
        {[
          { color: 'bg-rose-100', pos: 'top-[15%] left-[20%]', anim: 'animate-drift-right', dur: '65s', delay: '0s', blur: 'blur-[4px]' },
          { color: 'bg-sky-100', pos: 'top-[40%] right-[30%]', anim: 'animate-drift-left', dur: '75s', delay: '-15s', blur: 'blur-[3px]' },
          { color: 'bg-pink-100', pos: 'bottom-[20%] left-[10%]', anim: 'animate-drift-right', dur: '85s', delay: '-5s', blur: 'blur-[5px]' },
          { color: 'bg-blue-100', pos: 'top-[60%] right-[15%]', anim: 'animate-drift-left', dur: '55s', delay: '-20s', blur: 'blur-[2px]' },
          { color: 'bg-rose-100', pos: 'bottom-[40%] left-[70%]', anim: 'animate-drift-right', dur: '95s', delay: '-30s', blur: 'blur-[6px]' },
          { color: 'bg-sky-100', pos: 'top-[10%] right-[40%]', anim: 'animate-drift-left', dur: '110s', delay: '-10s', blur: 'blur-[8px]' },
          { color: 'bg-emerald-50', pos: 'top-[30%] left-[45%]', anim: 'animate-drift-right', dur: '60s', delay: '-25s', blur: 'blur-[1px]' },
          { color: 'bg-blue-50', pos: 'bottom-[5%] right-[20%]', anim: 'animate-drift-left', dur: '80s', delay: '-12s', blur: 'blur-[4px]' },
          { color: 'bg-pink-50', pos: 'top-[70%] left-[30%]', anim: 'animate-drift-right', dur: '120s', delay: '-40s', blur: 'blur-[10px]' },
          { color: 'bg-sky-50', pos: 'bottom-[30%] left-[80%]', anim: 'animate-drift-left', dur: '100s', delay: '-18s', blur: 'blur-[8px]' },
          { color: 'bg-rose-50', pos: 'top-[40%] left-[5%]', anim: 'animate-drift-right', dur: '130s', delay: '-50s', blur: 'blur-[12px]' },
          { color: 'bg-indigo-100', pos: 'top-[5%] left-[60%]', anim: 'animate-drift-left', dur: '70s', delay: '-2s', blur: 'blur-[3px]' },
          { color: 'bg-violet-100', pos: 'bottom-[15%] right-[10%]', anim: 'animate-drift-right', dur: '80s', delay: '-15s', blur: 'blur-[5px]' },
          { color: 'bg-blue-50', pos: 'top-[80%] left-[15%]', anim: 'animate-drift-left', dur: '90s', delay: '-25s', blur: 'blur-[2px]' },
          { color: 'bg-rose-50', pos: 'bottom-[60%] right-[40%]', anim: 'animate-drift-right', dur: '100s', delay: '-35s', blur: 'blur-[6px]' },
          { color: 'bg-teal-50', pos: 'top-[25%] right-[55%]', anim: 'animate-drift-left', dur: '110s', delay: '-45s', blur: 'blur-[4px]' },
          { color: 'bg-amber-50', pos: 'bottom-[45%] left-[25%]', anim: 'animate-drift-right', dur: '120s', delay: '-55s', blur: 'blur-[7px]' },
          { color: 'bg-sky-100', pos: 'top-[50%] left-[50%]', anim: 'animate-drift-left', dur: '130s', delay: '-65s', blur: 'blur-[3px]' },
          { color: 'bg-pink-100', pos: 'bottom-[10%] left-[40%]', anim: 'animate-drift-right', dur: '140s', delay: '-75s', blur: 'blur-[5px]' },
          { color: 'bg-indigo-50', pos: 'top-[15%] right-[10%]', anim: 'animate-drift-left', dur: '150s', delay: '-85s', blur: 'blur-[2px]' },
          { color: 'bg-rose-100', pos: 'bottom-[25%] right-[70%]', anim: 'animate-drift-right', dur: '160s', delay: '-95s', blur: 'blur-[8px]' },
          { color: 'bg-pink-100', pos: 'top-[35%] left-[15%]', anim: 'animate-drift-left', dur: '75s', delay: '-20s', blur: 'blur-[3px]' },
          { color: 'bg-rose-100', pos: 'top-[65%] right-[25%]', anim: 'animate-drift-right', dur: '95s', delay: '-40s', blur: 'blur-[4px]' },
          { color: 'bg-pink-50', pos: 'bottom-[5%] left-[55%]', anim: 'animate-drift-left', dur: '115s', delay: '-60s', blur: 'blur-[6px]' },
          { color: 'bg-rose-50', pos: 'top-[5%] right-[45%]', anim: 'animate-drift-right', dur: '135s', delay: '-80s', blur: 'blur-[2px]' },
          { color: 'bg-pink-100', pos: 'bottom-[75%] left-[85%]', anim: 'animate-drift-left', dur: '85s', delay: '-10s', blur: 'blur-[5px]' },
          { color: 'bg-rose-100', pos: 'top-[55%] left-[5%]', anim: 'animate-drift-right', dur: '105s', delay: '-30s', blur: 'blur-[3px]' },
          { color: 'bg-pink-50', pos: 'bottom-[35%] right-[15%]', anim: 'animate-drift-left', dur: '125s', delay: '-50s', blur: 'blur-[4px]' },
          { color: 'bg-rose-50', pos: 'top-[85%] right-[35%]', anim: 'animate-drift-right', dur: '145s', delay: '-70s', blur: 'blur-[6px]' },
          { color: 'bg-pink-100', pos: 'top-[20%] left-[75%]', anim: 'animate-drift-left', dur: '90s', delay: '-100s', blur: 'blur-[3px]' },
          { color: 'bg-rose-100', pos: 'bottom-[50%] left-[10%]', anim: 'animate-drift-right', dur: '110s', delay: '-110s', blur: 'blur-[5px]' },
        ].map((orb, i) => (
          <div 
            key={i}
            className={`absolute ${orb.pos} w-5 h-5 ${orb.color} opacity-60 rounded-full ${orb.blur} ${orb.anim}`}
            style={{ animationDelay: orb.delay, animationDuration: orb.dur }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[320px] px-4 animate-fade-in py-12">
        
        {/* ── LOGO SECTION ── */}
        <div className="flex flex-col items-center mb-14 transition-transform hover:scale-[1.02] duration-500">
          <div className="w-44 h-auto p-4 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100/50">
            <img src="/logo_full.png" alt="Elitetoolistic" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* ── AUTHENTICATION FORM ── */}
        <form onSubmit={handleLogin} className="flex flex-col gap-8">
          
          {/* Email Field */}
          <div className="group relative">
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 ml-0.5 group-focus-within:text-slate-900 transition-colors">
              Authorized Email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-0 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><rect width="20" height="16" x="2" y="4" rx="2"/>
                </svg>
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                required
                className="w-full pl-8 pr-2 py-3 bg-transparent border-b-2 border-slate-200 focus:border-indigo-600 focus:outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-300 placeholder:italic"
                style={{ fontFamily: 'Inter' }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="group relative">
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 ml-0.5 group-focus-within:text-slate-900 transition-colors">
              Secure Key
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-0 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-8 pr-12 py-3 bg-transparent border-b-2 border-slate-200 focus:border-indigo-600 focus:outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-300"
                style={{ fontFamily: 'Inter' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 text-slate-400 hover:text-slate-900 transition-colors"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="group relative mt-4 w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-2xl hover:bg-black active:scale-[0.98] transition-all duration-300 disabled:opacity-50 overflow-hidden"
          >
            <span className={`flex items-center justify-center gap-2 tracking-[0.3em] uppercase text-[11px] ${loading ? 'opacity-0' : 'opacity-100'}`}>
              Access Portal
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </button>

          {/* Smart Reveal Master Recovery */}
          <div className={`mt-8 pt-6 border-t border-slate-100 text-center flex flex-col gap-4 transition-all duration-500 ${
            (['kabirhaldar4444@gmail.com', 'support@elitetoolistic.com', 'karthikriyan7@gmail.com', 'info@elitetoolistic.com'].includes(email.trim().toLowerCase()))
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            <Link 
              to="/master-recovery" 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v6"/><path d="M8 11h8"/>
              </svg>
              Master Recovery
            </Link>
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">
              Elite Technology Group
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
