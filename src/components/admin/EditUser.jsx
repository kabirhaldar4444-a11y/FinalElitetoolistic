import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';
import UserSubmissions from './UserSubmissions';
import { useToast } from '../common/AlertProvider';

const DocumentPreview = ({ title, url }) => {
  return (
    <div className="glass-card-saas p-4 flex flex-col gap-3 h-full">
      <h4 className="text-sm font-bold tracking-widest uppercase text-[color:var(--text-light)]">{title}</h4>
      {url ? (
        url.match(/\.(jpeg|jpg|gif|png)$/i) || !url.includes('.pdf') ? (
           <a href={url} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-[color:var(--glass-border)] aspect-video bg-black/10 flex items-center justify-center">
             <img src={url} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <span className="text-white font-bold text-sm bg-primary-500/50 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-2">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  Inspect
                </span>
             </div>
           </a>
        ) : (
           <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 aspect-video rounded-xl border border-[color:var(--glass-border)] hover:border-primary-500 hover:bg-primary-500/5 transition-all text-primary-500 group">
             <svg className="group-hover:-translate-y-1 transition-transform" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
             <span className="text-sm font-bold">View PDF Document</span>
           </a>
        )
      ) : (
        <div className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-[color:var(--glass-border)] text-[color:var(--text-light)] bg-black/5 opacity-50">
          <svg width="24" height="24" className="mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          <span className="text-xs font-bold uppercase tracking-wider">No document</span>
        </div>
      )}
    </div>
  );
};

const EditUser = ({ user }) => {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const isSuperAdmin = user?.email === 'info@elitetoolistic.com';
  
  const [editUser, setEditUser] = useState({
    id: '',
    email: '',
    full_name: '',
    new_password: '',
    allotted_exam_ids: [],
    aadhaar_front_url: '',
    aadhaar_back_url: '',
    pan_url: '',
    profile_photo_url: '',
  });
  
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUserData();
    fetchExams();
  }, [id]);

  const fetchUserData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (data) {
      setEditUser({
        id: data.id,
        email: data.email || '',
        full_name: data.full_name || '',
        new_password: '',
        allotted_exam_ids: data.allotted_exam_ids || [],
        aadhaar_front_url: data.aadhaar_front_url || '',
        aadhaar_back_url: data.aadhaar_back_url || '',
        pan_url: data.pan_url || '',
        profile_photo_url: data.profile_photo_url || ''
      });
    } else if (error) {
      console.error('Error fetching user:', error);
      navigate('/admin/users');
    }
    setLoading(false);
  };

  const fetchExams = async () => {
    const { data } = await supabase.from('exams').select('id, title').order('title');
    if (data) setExams(data);
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setEditUser({...editUser, new_password: pass});
  };

  const toggleExamSelection = (examId) => {
    const currentList = editUser.allotted_exam_ids || [];
    if (currentList.includes(examId)) {
      setEditUser({
        ...editUser, 
        allotted_exam_ids: currentList.filter(eId => String(eId) !== String(examId))
      });
    } else {
      setEditUser({
        ...editUser, 
        allotted_exam_ids: [...currentList, examId]
      });
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('admin_update_candidate', {
        target_user_id: editUser.id,
        new_email: editUser.email,
        new_password: editUser.new_password || null,
        new_name: editUser.full_name,
        new_allotted_exam_ids: editUser.allotted_exam_ids || []
      });

      if (error) throw error;
      toast('Candidate updated successfully!', 'success');
      navigate('/admin/users');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-12 w-96 h-96 bg-primary-600/10 rounded-full blur-[128px] animate-blob pointer-events-none"></div>
      <div className="absolute bottom-0 -right-12 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] animate-blob animation-delay-2000 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Navigation & Header */}
        <div className="mb-12 animate-fade-in">
          <button 
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 font-semibold transition-colors mb-6 group text-[color:var(--text-light)] hover:text-[color:var(--text-dark)]"
          >
            <svg className="transform group-hover:-translate-x-1 transition-transform" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Candidates
          </button>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--text-dark), var(--text-light))' }}>
            Update User Profile
          </h1>
          <p className="mt-2 font-medium text-[color:var(--text-light)]">Modify candidate details and examination permissions</p>
        </div>

        <form onSubmit={handleSaveUser} className="space-y-12">
          {/* Main Controls Grid */}
          <div className="glass-card-saas p-8 md:p-12 space-y-8 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest ml-1 text-[color:var(--text-light)]">Candidate Email</label>
                <input 
                  type="email" 
                  value={editUser.email}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  required
                  className="w-full border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-dark)' }}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest ml-1 text-[color:var(--text-light)]">Full Name</label>
                <input 
                  type="text" 
                  value={editUser.full_name}
                  onChange={(e) => setEditUser({...editUser, full_name: e.target.value})}
                  required
                  className="w-full border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-dark)' }}
                />
              </div>
            </div>

            <div className="relative space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest ml-1 text-[color:var(--text-light)]">
                New Password <span className="text-[10px] font-normal lowercase opacity-60">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={editUser.new_password}
                  onChange={(e) => setEditUser({...editUser, new_password: e.target.value})}
                  placeholder="Set a new password..."
                  className="w-full border rounded-2xl pl-5 pr-24 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-dark)' }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" onClick={generateRandomPassword} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-primary-400 transition-all" title="Generate Random">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </button>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-primary-400 transition-all">
                    {showPassword ? (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Document Verification Section */}
          {isSuperAdmin ? (
            <div className="animate-slide-up animation-delay-100">
              <h2 className="text-2xl font-black mb-8 tracking-tight flex items-center gap-3 text-[color:var(--text-dark)]">
                <span className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"/></svg>
                </span>
                Identity Verification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <DocumentPreview title="Profile Photo" url={editUser.profile_photo_url} />
                 <DocumentPreview title="Aadhaar Front" url={editUser.aadhaar_front_url} />
                 <DocumentPreview title="Aadhaar Back" url={editUser.aadhaar_back_url} />
                 <DocumentPreview title="PAN Card" url={editUser.pan_url} />
              </div>
            </div>
          ) : (
            <div className="animate-slide-up animation-delay-100 p-6 rounded-2xl flex items-center gap-4 bg-orange-500/10 border border-orange-500/20">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <div>
                <h3 className="font-bold text-orange-500 mb-1">Privacy Protected</h3>
                <p className="text-sm font-medium text-[color:var(--text-light)]">Personal identity documents are restricted for privacy. Only Master Admins can view this information.</p>
              </div>
            </div>
          )}

          {/* Exam Allocation Section with Dropdown */}
          <div className="animate-slide-up animation-delay-200 relative z-40">
            <h2 className="text-2xl font-black mb-8 tracking-tight flex items-center gap-3 text-[color:var(--text-dark)]">
              <span className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-400">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              </span>
              Allotted Examinations
            </h2>
            
            <div className="relative glass-card-saas p-8">
              <div className="space-y-6">
                <label className="text-xs font-bold uppercase tracking-widest ml-1 text-[color:var(--text-light)]">Select Examinations to Allot</label>
                
                {/* Search & Selection Trigger */}
                <div className="relative group">
                  <div 
                    className="w-full min-h-[60px] border-2 rounded-2xl p-3 flex flex-wrap gap-2 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all cursor-text"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    onClick={() => document.getElementById('exam-search-input').focus()}
                  >
                    {/* Selected Tags */}
                    {exams.filter(e => editUser.allotted_exam_ids?.includes(e.id)).map(exam => (
                      <div key={exam.id} className="flex items-center gap-2 bg-primary-500/10 text-primary-600 px-3 py-1.5 rounded-xl border border-primary-500/20 animate-fade-in group/tag">
                        <span className="text-xs font-black tracking-tight">{exam.title}</span>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleExamSelection(exam.id); }}
                          className="hover:text-red-500 transition-colors"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    
                    {/* Input for Search */}
                    <input 
                      id="exam-search-input"
                      type="text"
                      placeholder={editUser.allotted_exam_ids?.length > 0 ? "" : "Search and select exams..."}
                      className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-400 min-w-[200px] h-9"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }}></div>
                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[110] glass-card-saas border-2 shadow-2xl rounded-2xl max-h-[300px] overflow-auto animate-slide-up" style={{ borderColor: 'var(--glass-border)' }}>
                        <div className="p-2 space-y-1">
                          {exams.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                            <div className="py-8 text-center text-slate-400 font-bold text-sm italic">No exams match your search</div>
                          )}
                          {exams.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).map(exam => (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleExamSelection(exam.id); }}
                              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all font-bold text-sm ${editUser.allotted_exam_ids?.includes(exam.id) ? 'bg-primary-500/10 text-primary-600' : 'hover:bg-slate-100 text-[color:var(--text-light)]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${editUser.allotted_exam_ids?.includes(exam.id) ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`}>
                                  {editUser.allotted_exam_ids?.includes(exam.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>}
                                </div>
                                {exam.title}
                              </div>
                              {editUser.allotted_exam_ids?.includes(exam.id) && <span className="text-[10px] font-black uppercase tracking-widest bg-primary-500 text-white px-2 py-0.5 rounded-full">Selected</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Candidates can only take exams that have been allotted to them here
                </p>
              </div>
            </div>
          </div>

          {/* User Submissions / Marks Release */}
          <div className="pt-12 border-t animate-slide-up animation-delay-400" style={{ borderColor: 'var(--glass-border)' }}>
            <h3 className="text-2xl font-black mb-8 tracking-tight text-[color:var(--text-dark)]">Performance & Mark Release</h3>
            <div className="glass-card-saas p-8">
              <UserSubmissions userId={id} />
            </div>
          </div>
          
          {/* Action Footer */}
          <div className="flex items-center justify-center pt-12 pb-20 animate-fade-in animation-delay-600">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-black py-5 px-16 rounded-full text-lg shadow-xl shadow-primary-600/20 hover:shadow-primary-600/40 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
            >
              {isSaving && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {isSaving ? 'Synchronizing Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;

