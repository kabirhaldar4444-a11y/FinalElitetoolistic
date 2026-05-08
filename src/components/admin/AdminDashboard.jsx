import React, { useState } from 'react';
import supabase from '../../utils/supabase';
import CreateUser from './CreateUser';
import ManageQuestions from './ManageQuestions';

const AdminDashboard = ({ user, profile, exams, addExam, deleteExam, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('exams');
  const isSuperAdmin = user?.email === 'kabirhaldar4444@gmail.com' || user?.email === 'support@elitetoolistic.com';
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDuration) return;
    await addExam({ title: newTitle, duration: parseInt(newDuration) });
    setNewTitle('');
    setNewDuration('');
  };

  if (selectedExam) {
    return (
      <ManageQuestions 
        exam={selectedExam} 
        onBack={() => {
          setSelectedExam(null);
          onRefresh();
        }} 
      />
    );
  }

  return (
    <div className="admin-dashboard container-premium min-h-[calc(100vh-80px)] p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 -left-12 w-[30rem] h-[30rem] bg-primary-600/10 rounded-full blur-[128px] animate-blob pointer-events-none"></div>
      <div className="absolute top-1/4 -right-12 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[128px] animate-blob animation-delay-2000 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto animate-fade-in">
        {/* Header Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent mb-2" style={{ backgroundImage: 'linear-gradient(to right, var(--text-dark), var(--text-light))' }}>
            Admin Dashboard
          </h1>
          <p className="text-[color:var(--text-light)] font-medium text-lg">Manage exams and candidate accounts from here.</p>
        </div>

        {/* Tab Switcher - Premium Mac-style segmented control */}
        <div className="flex flex-col md:flex-row justify-center md:justify-start mb-12">
          <div className="flex p-1.5 rounded-2xl border backdrop-blur-xl shadow-lg" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--glass-border)' }}>
            <button 
              onClick={() => setActiveTab('exams')} 
              className={`relative px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-500 overflow-hidden ${activeTab === 'exams' ? 'shadow-md scale-100' : 'hover:opacity-80 scale-95 opacity-70'}`}
              style={{ 
                backgroundColor: activeTab === 'exams' ? 'var(--card-bg)' : 'transparent',
                color: activeTab === 'exams' ? 'var(--text-dark)' : 'var(--text-light)',
                border: activeTab === 'exams' ? '1px solid var(--glass-border)' : '1px solid transparent'
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                Exam Management
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('candidates')} 
              className={`relative px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-500 overflow-hidden ${activeTab === 'candidates' ? 'shadow-md scale-100' : 'hover:opacity-80 scale-95 opacity-70'}`}
              style={{ 
                backgroundColor: activeTab === 'candidates' ? 'var(--card-bg)' : 'transparent',
                color: activeTab === 'candidates' ? 'var(--text-dark)' : 'var(--text-light)',
                border: activeTab === 'candidates' ? '1px solid var(--glass-border)' : '1px solid transparent'
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Student Management
              </div>
            </button>

            {isSuperAdmin && (
              <button 
                onClick={() => setActiveTab('staff')} 
                className={`relative px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-500 overflow-hidden ${activeTab === 'staff' ? 'shadow-md scale-100' : 'hover:opacity-80 scale-95 opacity-70'}`}
                style={{ 
                  backgroundColor: activeTab === 'staff' ? 'var(--card-bg)' : 'transparent',
                  color: activeTab === 'staff' ? 'var(--text-dark)' : 'var(--text-light)',
                  border: activeTab === 'staff' ? '1px solid var(--glass-border)' : '1px solid transparent'
                }}
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Staff Access
                </div>
              </button>
            )}
          </div>
        </div>
        
        {/* Dynamic Content Views */}
        <div className="transition-all duration-500 relative">
          {activeTab === 'exams' ? (
            <div className="exams-tab animate-slide-up">
              {/* Creation Module */}
              <div className="glass-card-saas p-8 md:p-10 mb-12 group border-l-4 border-l-primary-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                  <svg width="150" height="150" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3 tracking-tight text-[color:var(--text-dark)]">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-500/10 text-primary-500">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  </span>
                  Create New Exam
                </h3>
                
                <form onSubmit={handleSubmitExam} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end relative z-10">
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-[color:var(--text-light)]">Exam Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Advanced Data Structures Midterm"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="input-premium w-full text-base"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-[color:var(--text-light)]">Duration (Minutes)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 60" 
                      value={newDuration}
                      min="1"
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="input-premium w-full text-base"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <button type="submit" className="w-full btn-premium !py-4">
                      Create Exam
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </button>
                  </div>
                </form>
              </div>

              {/* Grid Module */}
              <div className="exam-list">
                <div className="flex justify-between items-end mb-6 border-b pb-4" style={{ borderColor: 'var(--glass-border)' }}>
                  <h3 className="text-2xl font-black tracking-tight text-[color:var(--text-dark)]">All Exams</h3>
                  <span className="text-sm font-bold bg-primary-500/10 text-primary-500 px-3 py-1 rounded-full border border-primary-500/20">{exams.length} Total</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--glass-border)' }}>
                      <svg className="text-slate-400 mb-4 opacity-50" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                      <p className="text-[color:var(--text-light)] font-bold">No exams created yet.</p>
                      <p className="text-[color:var(--text-light)] opacity-70 text-sm">Create an exam above to see it listed here.</p>
                    </div>
                  ) : (
                    exams.map((exam, i) => (
                      <div key={exam.id} className="glass-card-saas p-6 flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                          </div>
                          <h4 className="text-xl font-bold mb-2 text-[color:var(--text-dark)] leading-tight">{exam.title}</h4>
                          <p className="text-sm font-semibold flex items-center gap-2 mb-6" style={{ color: 'var(--text-light)' }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {exam.duration} Minutes Duration
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-6 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                          <button 
                            onClick={() => setSelectedExam(exam)} 
                            className="bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            Manage Questions
                          </button>
                          <button 
                            onClick={() => deleteExam(exam.id)} 
                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'candidates' ? (
            <div className="candidates-tab animate-slide-up">
              <CreateUser user={user} profile={profile} />
            </div>
          ) : (
            <div className="staff-tab animate-slide-up">
              {/* This tab only exists for Super Admin */}
              <div className="glass-card-saas p-8 border-l-4 border-l-purple-500">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3 tracking-tight text-[color:var(--text-dark)]">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-500">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </span>
                  Manage Staff Administrators
                </h3>
                <p className="text-[color:var(--text-light)] mb-8 font-medium">As the Master Admin, you can grant administrative access to other users. Search for a user in the Students tab and click "Promote to Admin" or create a new Admin account here.</p>
                <CreateUser user={user} profile={profile} initialRole="admin" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
