import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import AuthLayout from '../components/auth/AuthLayout';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('kabirhaldar4444@gmail.com');
  const [password, setPassword] = useState('qwerty@123');
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
        console.error('Login Error:', error.message);
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

      // STEP 6: Hierarchical Redirect Logic
      // MASTER ADMIN CHECK (Hardcoded Email Safety)
      if (user.email === 'kabirhaldar4444@gmail.com' || user.email === 'support@elitetoolistic.com' || profile.role === 'admin') {
        await onLoginSuccess();
        navigate('/admin');
      } 
      else {
        await supabase.auth.signOut();
        alert("Unauthorized: You do not have administrative privileges.");
      }
    } catch (err) {
      console.error('Final Admin Login Error:', err);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Admin Portal" 
      subtitle="Administrative access for exam management"
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest ml-1 transition-colors duration-300" style={{ color: 'var(--text-light)' }}>Admin Email</label>
          <input 
            type="email" 
            placeholder="admin@elitetoolistic.com" 
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
          <label className="text-xs font-bold uppercase tracking-widest ml-1 transition-colors duration-300" style={{ color: 'var(--text-light)' }}>Admin Password</label>
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
          className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Enter Admin Panel</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;

