import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import DisclaimerOverlay from '../DisclaimerOverlay';

const CandidateDashboard = ({ exams, onStartExam, profile, user }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchSubmissions();

      // REALTIME: Listen for score release or submission updates
      const subSubscription = supabase
        .channel('submission-updates')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'submissions',
          filter: `user_id=eq.${profile.id}`
        }, () => {
          fetchSubmissions();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subSubscription);
      };
    }
  }, [profile?.id]);

  const fetchSubmissions = async () => {
    setLoadingResults(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*, exams(title)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (data) setSubmissions(data);
    setLoadingResults(false);
  };

  const completedExamIds = submissions.map(s => s.exam_id);
  const allottedExamIds = profile?.allotted_exam_ids || [];
  const availableExams = exams.filter(e => 
    allottedExamIds.includes(e.id) && !completedExamIds.includes(e.id)
  );
  const filteredExams = availableExams.filter(e =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <>
    <DisclaimerOverlay user={user} profile={profile} />
    <div className="premium-container min-h-[calc(100vh-80px)] p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 -right-12 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[128px] animate-blob pointer-events-none"></div>
      <div className="absolute bottom-0 -left-12 w-[30rem] h-[30rem] bg-primary-600/10 rounded-full blur-[128px] animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto animate-fade-in">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b pb-8" style={{ borderColor: 'var(--glass-border)' }}>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent mb-2" style={{ backgroundImage: 'linear-gradient(to right, var(--text-dark), var(--text-light))' }}>
              My Assessments
            </h1>
            <p className="text-lg font-medium text-[color:var(--text-light)]">
              Welcome back, <span className="font-bold text-primary-500">{profile?.full_name || 'Candidate'}</span>
            </p>
          </div>
          <div className="glass-effect px-6 py-3 rounded-full flex items-center gap-3 border shadow-sm" style={{ backgroundColor: 'var(--input-bg)' }}>
            <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-light)]">Status</span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-500 font-bold text-sm">Verified Profile</span>
            </div>
          </div>
        </div>

        {/* Available Exams Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-black tracking-tight text-[color:var(--text-dark)] mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </span>
            Available Exams
            {searchQuery && (
              <span className="ml-2 px-3 py-1 text-xs font-black rounded-full bg-primary-500/10 text-primary-500">
                {filteredExams.length} result{filteredExams.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>

          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[color:var(--text-light)]">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search exams by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-2xl font-medium text-sm transition-all duration-300 outline-none focus:ring-2 focus:ring-primary-500/40"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-dark)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center text-[color:var(--text-light)] hover:text-[color:var(--text-dark)] transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExams.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--glass-border)' }}>
                {searchQuery ? (
                  <>
                    <svg className="text-slate-400 mb-4 opacity-50" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <p className="text-[color:var(--text-light)] font-bold text-lg">No exams match "{searchQuery}"</p>
                    <button onClick={() => setSearchQuery('')} className="mt-4 px-6 py-2 rounded-full text-sm font-bold bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-all">Clear Search</button>
                  </>
                ) : (
                  <>
                    <svg className="text-slate-400 mb-4 opacity-50" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-[color:var(--text-light)] font-bold text-lg">No pending exams assigned to you.</p>
                    <p className="text-[color:var(--text-light)] opacity-70 mt-1">Check back later or contact your instructor.</p>
                  </>
                )}
              </div>
            ) : (
              filteredExams.map((exam, i) => (
                <div 
                  key={exam.id} 
                  className={`glass-card-saas p-8 flex flex-col h-full transition-all duration-500 group animate-slide-up ${profile?.is_exam_locked ? 'opacity-75 saturate-50' : 'hover:-translate-y-2 hover:shadow-2xl shadow-xl'}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-[color:var(--text-dark)] leading-tight mb-4">{exam.title}</h3>
                    
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-8 border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                      <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">⏱</span>
                      <span className="font-bold text-[color:var(--text-light)]">{exam.duration} Minutes Duration</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => !profile?.is_exam_locked && onStartExam(exam)} 
                    disabled={profile?.is_exam_locked}
                    className={`w-full py-4 px-6 rounded-2xl font-black tracking-wide flex items-center justify-center gap-2 transition-all duration-300 ${
                      profile?.is_exam_locked 
                        ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-2 border-slate-400/20' 
                        : 'bg-primary-600 hover:bg-primary-500 text-white shadow-xl shadow-primary-600/30 hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {profile?.is_exam_locked ? (
                      <>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        Access Locked By Admin
                      </>
                    ) : (
                      <>
                        Start Exam
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Completed Assessments Section */}
        <section>
          <h2 className="text-2xl font-black tracking-tight text-[color:var(--text-dark)] mb-8 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            Archived Submissions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingResults ? (
              <div className="col-span-full py-12 flex justify-center">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : submissions.length === 0 ? (
               <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--glass-border)' }}>
                 <p className="text-[color:var(--text-light)] font-bold text-lg">Your submission history is empty.</p>
               </div>
            ) : (
              submissions.map((sub, i) => (
                <div 
                  key={sub.id} 
                  className={`glass-card-saas p-8 flex flex-col transition-all duration-300 animate-slide-up hover:-translate-y-1 hover:shadow-lg ${
                    (!sub.is_released || profile?.is_exam_locked) ? 'opacity-85' : 'opacity-100 border-l-4 border-emerald-500'
                  }`}
                  style={{ animationDelay: `${(i % 10) * 100}ms` }}
                >
                  <h4 className="text-xl font-bold text-[color:var(--text-dark)] mb-2 line-clamp-2">{sub.exams?.title}</h4>
                  <p className="text-sm font-medium text-[color:var(--text-light)] mb-8">
                    Submitted: {new Date(sub.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}
                  </p>
                  
                  <div className="mt-auto p-5 rounded-2xl border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-light)] mb-1">Evaluation Status</p>
                        <p className={`font-black flex items-center gap-1.5 ${(sub.is_released && !profile?.is_exam_locked) ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {(sub.is_released && !profile?.is_exam_locked) ? (
                            <>
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                              Validated
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              PENDING
                            </>
                          )}
                        </p>
                      </div>
                      
                      {(sub.is_released && !profile?.is_exam_locked) && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-light)] mb-1">Final Score</p>
                          <p className="text-3xl font-black tracking-tight text-primary-500">
                            {sub.admin_score_override !== null ? sub.admin_score_override : sub.score}
                            <span className="text-sm font-bold text-slate-400 ml-1">/{sub.total_questions * 5}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
    </>
  );
};

export default CandidateDashboard;
