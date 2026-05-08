import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import AuthLayout from '../components/auth/AuthLayout';

const CandidateLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // STEP 1: Authenticate
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert("Invalid email or password");
        return;
      }

      // STEP 2: WAIT (CRITICAL - DO NOT REMOVE)
      await new Promise(res => setTimeout(res, 300));

      // STEP 3: Get user (NOT session)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        await supabase.auth.signOut();
        alert("Authentication failed. Please try again.");
        return;
      }

      // STEP 4: Fetch profile safely (NO .single())
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // STEP 5: Validate profile
      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        await supabase.auth.signOut();
        alert("Account not found or access denied");
        return;
      }

      // STEP 6: Redirect
      if (profile.role === 'candidate') {
        await onLoginSuccess();
        navigate('/');
      } else if (profile.role === 'admin' || user.email === 'kabirhaldar4444@gmail.com') {
        // Admin logged into candidate page - allow and redirect to admin
        await onLoginSuccess();
        navigate('/admin');
      } else {
        await supabase.auth.signOut();
        alert("Access restricted: Invalid account role.");
      }
    } catch (err) {
      console.error('Final Candidate Login Error:', err);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Candidate Login" 
      subtitle="Sign in to start your examination"
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest ml-1 transition-colors duration-300" style={{ color: 'var(--text-light)' }}>Email Address</label>
          <input 
            type="email" 
            placeholder="name@company.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            autoComplete="off"
            className="w-full rounded-2xl px-5 py-4 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            style={{ 
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-dark)',
              borderWidth: '1px'
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest ml-1 transition-colors duration-300" style={{ color: 'var(--text-light)' }}>Password</label>
          <div className="relative flex items-center group">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              autoComplete="off"
              className="w-full rounded-2xl px-5 py-4 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              style={{ 
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-dark)',
                borderWidth: '1px'
              }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 transition-colors duration-300 focus:outline-none"
              style={{ color: 'var(--text-light)' }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary-600/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Enter Examination</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <polyline points="16 11 18 13 22 9"></polyline>
              </svg>
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default CandidateLogin;

