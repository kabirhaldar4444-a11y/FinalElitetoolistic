import React, { useState } from 'react';
import supabase from '../../utils/supabase';
import { useToast } from '../common/AlertProvider';

const CreateUser = ({ user, profile, initialRole = 'candidate' }) => {
  const toast = useToast();
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [role, setRole] = useState(initialRole);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSuperAdmin = user?.email === 'kabirhaldar4444@gmail.com' || user?.email === 'support@elitetoolistic.com';
  
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCandidatePassword(pass);
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    // Trim values for consistency
    const emailToCreate = candidateEmail.trim().toLowerCase();
    const nameToCreate = candidateName.trim();
    const passwordToCreate = candidatePassword.trim();

    if (!emailToCreate || !nameToCreate || !passwordToCreate) {
      toast('Please fill all required fields.', 'warning');
      setIsCreating(false);
      return;
    }
    
    try {
      // Step 2: Intelligent Native Registration (No hacks)
      const { createClient } = await import('@supabase/supabase-js');
      
      // Create a secondary client that DOES NOT save session data (Admin stays logged in)
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );

      const { data, error: createError } = await supabaseAdmin.auth.signUp({
        email: emailToCreate,
        password: passwordToCreate,
        options: {
          data: {
            full_name: nameToCreate,
            role: role
          }
        }
      });

      if (createError) {
        console.error('Failed to register user:', createError);
        throw new Error(createError.message || "Failed to create user account.");
      }

      toast(`${role === 'admin' ? 'Administrative' : 'Candidate'} account created successfully!`, 'success');
      setCandidateEmail('');
      setCandidatePassword('');
      setCandidateName('');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-user-page w-full flex flex-col items-center">
      <div className="glass-card-saas w-full max-w-2xl p-8 md:p-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
          <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
        </div>

        <div className="mb-10 text-center relative z-10">
          <h2 className="text-3xl font-black tracking-tight mb-2 text-[color:var(--text-dark)]">
            {role === 'admin' ? 'Create Staff Access' : 'Create User Account'}
          </h2>
          <p className="text-[color:var(--text-light)] text-sm font-medium">
            {role === 'admin' ? 'Register a new administrative staff member.' : 'Create a new candidate login account.'}
          </p>
        </div>
        
        <form autoComplete="off" onSubmit={handleCreateCandidate} className="flex flex-col gap-6 relative z-10">
          {/* Role Selection (Only for Super Admin) */}
          {isSuperAdmin && !initialRole && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-[color:var(--text-light)]">Account Role</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-premium w-full py-4 appearance-none cursor-pointer"
              >
                <option value="candidate">Student/Candidate</option>
                <option value="admin">Staff Administrator</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-[color:var(--text-light)]">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[color:var(--text-light)]">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <input 
                type="email" 
                placeholder="user@elitetoolistic.com" 
                value={candidateEmail}
                autoComplete="off"
                data-lpignore="true"
                onChange={(e) => setCandidateEmail(e.target.value)}
                required
                className="input-premium w-full py-4 text-[color:var(--text-dark)]"
                style={{ paddingLeft: '3rem' }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-[color:var(--text-light)]">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[color:var(--text-light)]">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                value={candidateName}
                autoComplete="off"
                data-lpignore="true"
                onChange={(e) => setCandidateName(e.target.value)}
                required 
                className="input-premium w-full py-4 text-[color:var(--text-dark)]"
                style={{ paddingLeft: '3rem' }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-[color:var(--text-light)]">Account Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[color:var(--text-light)]">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Generate a secure password..." 
                value={candidatePassword}
                autoComplete="new-password"
                data-lpignore="true"
                onChange={(e) => setCandidatePassword(e.target.value)}
                required
                className="input-premium w-full py-4 text-[color:var(--text-dark)]"
                style={{ paddingLeft: '3rem', paddingRight: '6rem' }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={generatePassword}
                  className="p-2 rounded-xl hover:bg-white/5 text-[color:var(--text-light)] hover:text-primary-500 transition-colors"
                  title="Generate Password"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 rounded-xl hover:bg-white/5 text-[color:var(--text-light)] hover:text-primary-500 transition-colors"
                  title={showPassword ? "Mask Password" : "Reveal Password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 mt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <button 
              type="submit" 
              className="w-full btn-premium !py-4" 
              disabled={isCreating}
            >
              {isCreating && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {isCreating ? 'Creating...' : `Create ${role === 'admin' ? 'Staff' : 'Student'} Account`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
