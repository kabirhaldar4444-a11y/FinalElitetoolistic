import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';

const AdminAdmissions = ({ user, profile }) => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null); // Lightbox state: { type: 'image' | 'video', title: string, url: string }

  // Account auto-create state in Approval modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [targetApp, setTargetApp] = useState(null);
  const [autoCreateAccount, setAutoCreateAccount] = useState(true);
  const [candidatePassword, setCandidatePassword] = useState('Candidate@123');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    let fetchedData = [];

    try {
      // 1. Fetch from Supabase admissions table
      const { data, error } = await supabase
        .from('admissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        fetchedData = data;
      }
    } catch (err) {
      console.warn('Fetch admissions notice:', err);
    }

    // 2. Fetch local storage backup
    const local = JSON.parse(localStorage.getItem('elitetoolistic_admissions') || '[]');

    // Merge without duplicates
    const combined = [...fetchedData];
    local.forEach(item => {
      if (!combined.some(existing => existing.id === item.id || (existing.email === item.email && existing.created_at === item.created_at))) {
        combined.push(item);
      }
    });

    setAdmissions(combined);
    setLoading(false);
  };

  // Video URL Extractor Helper
  const getVideoUrl = (item) => {
    if (!item) return '';
    if (item.video_url && typeof item.video_url === 'string' && item.video_url.trim()) {
      return item.video_url.trim();
    }
    if (item.profile_photo_url && typeof item.profile_photo_url === 'string') {
      const url = item.profile_photo_url.trim();
      if (
        url.includes('.webm') ||
        url.includes('.mp4') ||
        url.includes('.mov') ||
        url.includes('.mkv') ||
        url.includes('.avi') ||
        url.includes('video') ||
        url.includes('profile_video') ||
        url.startsWith('data:video/') ||
        url.startsWith('blob:')
      ) {
        return url;
      }
    }
    return '';
  };

  // Photo URL Extractor Helper
  const getPhotoUrl = (item) => {
    if (!item) return '';
    const videoUrl = getVideoUrl(item);
    if (item.profile_photo_url && item.profile_photo_url !== videoUrl) {
      return item.profile_photo_url;
    }
    return '';
  };

  // Filtered Admissions
  const filteredAdmissions = admissions.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (app.full_name || '').toLowerCase().includes(searchLower) ||
      (app.email || '').toLowerCase().includes(searchLower) ||
      (app.phone || '').includes(searchTerm) ||
      (app.course_name || '').toLowerCase().includes(searchLower) ||
      (app.city || '').toLowerCase().includes(searchLower);
    
    return matchesStatus && matchesSearch;
  });

  // Metrics
  const totalCount = admissions.length;
  const pendingCount = admissions.filter(a => a.status === 'pending').length;
  const approvedCount = admissions.filter(a => a.status === 'approved').length;
  const rejectedCount = admissions.filter(a => a.status === 'rejected').length;

  // Open Approve Modal
  const openApproveModal = (app) => {
    setTargetApp(app);
    setCandidatePassword(`Candidate@${Math.floor(100 + Math.random() * 900)}`);
    setShowApproveModal(true);
  };

  // Handle Approve Application
  const handleApprove = async () => {
    if (!targetApp) return;
    setActionLoading(true);
    setActionMsg('Approving admission application...');

    try {
      // 1. Update status in Supabase if exists
      await supabase
        .from('admissions')
        .update({ status: 'approved' })
        .eq('id', targetApp.id);

      // 2. Auto-create Candidate User Account if checked
      if (autoCreateAccount) {
        setActionMsg('Creating candidate student user account...');
        
        // Call RPC admin_create_candidate if available
        const { data: rpcData, error: rpcError } = await supabase.rpc('admin_create_candidate', {
          candidate_email: targetApp.email,
          candidate_password: candidatePassword,
          candidate_name: targetApp.full_name
        });

        if (rpcError) {
          console.warn('RPC create user note:', rpcError.message);
        }
      }

      // Update local storage backup
      const local = JSON.parse(localStorage.getItem('elitetoolistic_admissions') || '[]');
      const updatedLocal = local.map(item => item.id === targetApp.id ? { ...item, status: 'approved' } : item);
      localStorage.setItem('elitetoolistic_admissions', JSON.stringify(updatedLocal));

      // Refresh state
      setAdmissions(prev => prev.map(item => item.id === targetApp.id ? { ...item, status: 'approved' } : item));
      if (selectedAdmission && selectedAdmission.id === targetApp.id) {
        setSelectedAdmission(prev => ({ ...prev, status: 'approved' }));
      }

      alert(`Application for ${targetApp.full_name} has been APPROVED!${autoCreateAccount ? ` Student account created with password: ${candidatePassword}` : ''}`);
      setShowApproveModal(false);
      setTargetApp(null);
    } catch (err) {
      console.error('Approve application error:', err);
      alert(err.message || 'Failed to approve application.');
    } finally {
      setActionLoading(false);
      setActionMsg('');
    }
  };

  // Handle Reject Application
  const handleReject = async (app) => {
    if (!window.confirm(`Are you sure you want to reject the application for ${app.full_name}?`)) return;

    try {
      await supabase
        .from('admissions')
        .update({ status: 'rejected' })
        .eq('id', app.id);

      // Update local storage backup
      const local = JSON.parse(localStorage.getItem('elitetoolistic_admissions') || '[]');
      const updatedLocal = local.map(item => item.id === app.id ? { ...item, status: 'rejected' } : item);
      localStorage.setItem('elitetoolistic_admissions', JSON.stringify(updatedLocal));

      setAdmissions(prev => prev.map(item => item.id === app.id ? { ...item, status: 'rejected' } : item));
      if (selectedAdmission && selectedAdmission.id === app.id) {
        setSelectedAdmission(prev => ({ ...prev, status: 'rejected' }));
      }
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  // Handle Delete Application
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this admission record?')) return;

    try {
      await supabase.from('admissions').delete().eq('id', id);

      const local = JSON.parse(localStorage.getItem('elitetoolistic_admissions') || '[]');
      const updatedLocal = local.filter(item => item.id !== id);
      localStorage.setItem('elitetoolistic_admissions', JSON.stringify(updatedLocal));

      setAdmissions(prev => prev.filter(item => item.id !== id));
      if (selectedAdmission && selectedAdmission.id === id) {
        setSelectedAdmission(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[color:var(--text-dark)] flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/></svg>
            </span>
            Admission Applications
          </h2>
          <p className="text-sm text-[color:var(--text-light)] font-medium mt-1">
            Review identity documents, watch live video statements, and verify candidate enrollments.
          </p>
        </div>

        <button 
          onClick={fetchAdmissions} 
          className="bg-primary-600/10 hover:bg-primary-600/20 text-primary-500 font-bold px-5 py-2.5 rounded-xl border border-primary-500/20 text-xs flex items-center gap-2 transition-all shadow-sm"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
          Refresh Applications
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-saas p-5 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-light)]">Total Applications</span>
          <span className="text-3xl font-black text-[color:var(--text-dark)] mt-2">{totalCount}</span>
        </div>

        <div className="glass-card-saas p-5 flex flex-col justify-between border-l-4 border-l-amber-500">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Pending Review</span>
          <span className="text-3xl font-black text-amber-500 mt-2">{pendingCount}</span>
        </div>

        <div className="glass-card-saas p-5 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Approved</span>
          <span className="text-3xl font-black text-emerald-500 mt-2">{approvedCount}</span>
        </div>

        <div className="glass-card-saas p-5 flex flex-col justify-between border-l-4 border-l-rose-500">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Rejected</span>
          <span className="text-3xl font-black text-rose-500 mt-2">{rejectedCount}</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="w-full md:w-96 relative">
          <input 
            type="text"
            placeholder="Search by name, email, phone, course, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium w-full pl-11 text-xs"
          />
          <svg className="absolute left-4 top-3.5 text-slate-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        </div>

        {/* Status Pills */}
        <div className="flex p-1 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--input-bg)]">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-lg font-bold text-xs capitalize transition-all ${statusFilter === st ? 'bg-[color:var(--card-bg)] text-[color:var(--text-dark)] shadow-sm' : 'text-[color:var(--text-light)] hover:opacity-80'}`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* Applications Table */}
      <div className="glass-card-saas overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-[color:var(--text-light)]">Loading admission records...</p>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto text-slate-400 opacity-50 mb-3" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            <p className="text-base font-bold text-[color:var(--text-dark)]">No admissions found</p>
            <p className="text-xs text-[color:var(--text-light)]">Try adjusting your search terms or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-[color:var(--glass-border)] text-[color:var(--text-light)] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Live Video</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--glass-border)]">
                {filteredAdmissions.map((app) => {
                  const videoUrl = getVideoUrl(app);
                  const photoUrl = getPhotoUrl(app);

                  return (
                    <tr key={app.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      
                      {/* Candidate */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-white text-xs flex-shrink-0 relative group">
                            {photoUrl ? (
                              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : videoUrl ? (
                              <div className="w-full h-full bg-indigo-900/60 flex items-center justify-center text-indigo-300 font-bold">
                                🎥
                              </div>
                            ) : (
                              (app.full_name || 'C')[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[color:var(--text-dark)] text-sm flex items-center gap-1.5">
                              {app.full_name}
                            </p>
                            <p className="text-[10px] text-[color:var(--text-light)]">IP: {app.ip_address || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4">
                        <p className="font-semibold text-[color:var(--text-dark)]">{app.email}</p>
                        <p className="text-[11px] text-[color:var(--text-light)]">{app.phone}</p>
                      </td>

                      {/* Course */}
                      <td className="p-4 font-bold text-[color:var(--text-dark)]">
                        {app.course_name}
                      </td>

                      {/* Location */}
                      <td className="p-4 text-[color:var(--text-light)] font-medium">
                        {app.city}, {app.state} ({app.pincode})
                      </td>

                      {/* Video Status Badge */}
                      <td className="p-4">
                        {videoUrl ? (
                          <button
                            onClick={() => setSelectedAdmission(app)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            🎥 Play Video
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No Video</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          app.status === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' 
                            : app.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                        }`}>
                          {app.status || 'pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedAdmission(app)}
                          className="bg-primary-600/10 hover:bg-primary-600 text-primary-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all text-xs"
                        >
                          👁️ View Details
                        </button>

                        {app.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => openApproveModal(app)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold transition-all text-xs"
                            >
                              ✓ Approve
                            </button>
                            <button 
                              onClick={() => handleReject(app)}
                              className="bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all text-xs"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}

                        <button 
                          onClick={() => handleDelete(app.id)}
                          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-1.5 rounded-lg font-bold transition-all"
                          title="Delete record"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL DETAILS & VIDEO PLAYER MODAL */}
      {selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-[2.5rem] p-6 md:p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto animate-fade-in relative shadow-2xl space-y-6">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedAdmission(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10"
            >
              ✕
            </button>

            {/* Candidate Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-2xl text-primary-400 border border-slate-700 flex-shrink-0 shadow-lg">
                {getPhotoUrl(selectedAdmission) ? (
                  <img src={getPhotoUrl(selectedAdmission)} alt="" className="w-full h-full object-cover" />
                ) : (
                  (selectedAdmission.full_name || 'C')[0].toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">{selectedAdmission.full_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAdmission.email} • {selectedAdmission.phone}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                    selectedAdmission.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : selectedAdmission.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    Status: {selectedAdmission.status || 'pending'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">ID: {selectedAdmission.id?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* LIVE CANDIDATE VIDEO STATEMENT SECTION (ULTRA MODERN PLAYER) */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-5 md:p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                  <h4 className="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                    <span>🎥</span> Candidate Live Video Statement
                  </h4>
                </div>
                {getVideoUrl(selectedAdmission) && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                    RECORDING VERIFIED
                  </span>
                )}
              </div>

              {getVideoUrl(selectedAdmission) ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl group">
                    <video 
                      src={getVideoUrl(selectedAdmission)} 
                      controls 
                      preload="auto"
                      playsInline
                      className="w-full max-h-[380px] object-contain rounded-2xl bg-black"
                    />
                  </div>

                  {/* Video Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-xs">
                    <span className="text-slate-400 font-medium text-[11px]">
                      📹 Recorded Live Video Verification Statement
                    </span>
                    <div className="flex items-center gap-2">
                      <a 
                        href={getVideoUrl(selectedAdmission)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-[11px]"
                      >
                        ↗ Open Video in New Tab
                      </a>
                      <a 
                        href={getVideoUrl(selectedAdmission)} 
                        download={`candidate_video_${selectedAdmission.full_name}.webm`}
                        className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-[11px]"
                      >
                        📥 Download Video
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-44 bg-slate-950/80 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-2xl text-slate-500">
                    📹
                  </div>
                  <p className="text-sm font-bold text-slate-300">No Live Video Statement Recorded</p>
                  <p className="text-xs text-slate-500 max-w-sm">The candidate did not attach a live camera statement with this application submission.</p>
                </div>
              )}

            </div>

            {/* Candidate Metadata Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
              <div><strong className="text-slate-400">Course Applied:</strong> <span className="text-white font-bold">{selectedAdmission.course_name}</span></div>
              <div><strong className="text-slate-400">Date Applied:</strong> <span className="text-white font-bold">{new Date(selectedAdmission.created_at || Date.now()).toLocaleString()}</span></div>
              <div><strong className="text-slate-400">City / State:</strong> <span className="text-white font-bold">{selectedAdmission.city}, {selectedAdmission.state} ({selectedAdmission.pincode})</span></div>
              <div><strong className="text-slate-400">IP Address:</strong> <span className="text-white font-bold">{selectedAdmission.ip_address || 'Not captured'}</span></div>
              <div className="md:col-span-2"><strong className="text-slate-400">Residential Address:</strong> <span className="text-white font-bold">{selectedAdmission.address || 'N/A'}</span></div>
            </div>

            {/* Verification Documents Gallery */}
            <div className="space-y-4">
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>📄</span> Identity Verification Documents & Digital Signature
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Digital Signature */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">Digital Signature</span>
                  {selectedAdmission.signature_url ? (
                    <div 
                      onClick={() => setPreviewMedia({ type: 'image', title: 'Digital Signature', url: selectedAdmission.signature_url })}
                      className="bg-white p-3 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:opacity-90 transition-all border border-slate-700 group relative"
                    >
                      <img src={selectedAdmission.signature_url} alt="Signature" className="max-h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all rounded-xl">
                        🔍 Click to Enlarge
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-900 flex items-center justify-center text-slate-600 rounded-xl font-medium text-xs">No Signature Provided</div>
                  )}
                </div>

                {/* Aadhaar Front */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">Aadhaar Card (Front)</span>
                  {selectedAdmission.aadhaar_front_url ? (
                    <div 
                      onClick={() => setPreviewMedia({ type: 'image', title: 'Aadhaar Card (Front)', url: selectedAdmission.aadhaar_front_url })}
                      className="relative h-40 rounded-xl overflow-hidden cursor-pointer group border border-slate-800"
                    >
                      <img src={selectedAdmission.aadhaar_front_url} alt="Aadhaar Front" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                        🔍 Click to Enlarge
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-900 flex items-center justify-center text-slate-600 rounded-xl font-medium text-xs">No Document Uploaded</div>
                  )}
                </div>

                {/* Aadhaar Back */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">Aadhaar Card (Back)</span>
                  {selectedAdmission.aadhaar_back_url ? (
                    <div 
                      onClick={() => setPreviewMedia({ type: 'image', title: 'Aadhaar Card (Back)', url: selectedAdmission.aadhaar_back_url })}
                      className="relative h-40 rounded-xl overflow-hidden cursor-pointer group border border-slate-800"
                    >
                      <img src={selectedAdmission.aadhaar_back_url} alt="Aadhaar Back" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                        🔍 Click to Enlarge
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-900 flex items-center justify-center text-slate-600 rounded-xl font-medium text-xs">No Document Uploaded</div>
                  )}
                </div>

                {/* PAN Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">PAN Card Document</span>
                  {selectedAdmission.pan_url ? (
                    <div 
                      onClick={() => setPreviewMedia({ type: 'image', title: 'PAN Card Document', url: selectedAdmission.pan_url })}
                      className="relative h-40 rounded-xl overflow-hidden cursor-pointer group border border-slate-800 bg-slate-900 p-2"
                    >
                      <img src={selectedAdmission.pan_url} alt="PAN Card" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all rounded-xl">
                        🔍 Click to Enlarge
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-900 flex items-center justify-center text-slate-600 rounded-xl font-medium text-xs">No Document Uploaded</div>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-800">
              {selectedAdmission.status === 'pending' && (
                <>
                  <button 
                    onClick={() => { const target = selectedAdmission; setSelectedAdmission(null); openApproveModal(target); }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    ✓ Approve Application
                  </button>
                  <button 
                    onClick={() => handleReject(selectedAdmission)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    ✕ Reject Application
                  </button>
                </>
              )}
              <button 
                onClick={() => setSelectedAdmission(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl text-xs"
              >
                Close Modal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX MODAL FOR DOCUMENTS */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full flex flex-col items-center space-y-4 animate-fade-in">
            <button 
              onClick={() => setPreviewMedia(null)}
              className="absolute -top-12 right-0 text-white bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
            >
              ✕
            </button>
            <h4 className="text-white font-bold text-base tracking-wide">{previewMedia.title}</h4>
            <div className="bg-slate-950 p-2 rounded-3xl border border-slate-800 max-h-[80vh] overflow-hidden flex items-center justify-center">
              <img src={previewMedia.url} alt={previewMedia.title} className="max-h-[75vh] max-w-full object-contain rounded-2xl" />
            </div>
            <a 
              href={previewMedia.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-2"
            >
              ↗ Open Original Image
            </a>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {showApproveModal && targetApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-[2rem] p-6 md:p-8 max-w-md w-full animate-fade-in shadow-2xl">
            <h3 className="text-xl font-black mb-2 text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">✓</span>
              Approve Admission
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              You are approving the admission for <strong className="text-white">{targetApp.full_name}</strong> ({targetApp.email}).
            </p>

            <label className="flex items-start gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 cursor-pointer">
              <input 
                type="checkbox"
                checked={autoCreateAccount}
                onChange={(e) => setAutoCreateAccount(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Auto-Create Candidate Account</span>
                <span className="text-slate-400">Instantly creates student user login for exam portal.</span>
              </div>
            </label>

            {autoCreateAccount && (
              <div className="space-y-2 mb-6">
                <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Candidate Password</label>
                <input 
                  type="text" 
                  value={candidatePassword}
                  onChange={(e) => setCandidatePassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowApproveModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                {actionLoading ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAdmissions;
