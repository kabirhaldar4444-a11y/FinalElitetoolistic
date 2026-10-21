import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';

const steps = [
  { id: 1, label: "Admission confirmation" },
  { id: 2, label: "Document KYC verification" },
  { id: 3, label: "Video KYC authentication" },
  { id: 4, label: "GST Invoice delivered" },
  { id: 5, label: "PDF study material shared" },
  { id: 6, label: "Enrollment certificate issued" },
  { id: 7, label: "Video lectures delivered" },
  { id: 8, label: "Final exam login shared" },
  { id: 9, label: "Result & PC delivered" }
];

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ServiceDeliveryManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter state for Cards Directory View
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'in_progress'

  // Set of checked step IDs (1 to 9) for current candidate
  const [completedSteps, setCompletedSteps] = useState(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));

  useEffect(() => {
    fetchCandidates();
  }, [id]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const [candidatesRes, admissionsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'candidate')
          .order('full_name', { ascending: true }),
        supabase
          .from('admissions')
          .select('*')
      ]);

      const candidatesList = candidatesRes.data || [];
      const admissionsList = admissionsRes.data || [];
      const localAdmissions = JSON.parse(localStorage.getItem('elitetoolistic_admissions') || '[]');

      // Merge admission KYC documents into candidates by matching email
      const mergedCandidates = candidatesList.map(c => {
        const matchingAdm = admissionsList.find(a => a.email?.toLowerCase().trim() === c.email?.toLowerCase().trim()) ||
                            localAdmissions.find(a => a.email?.toLowerCase().trim() === c.email?.toLowerCase().trim());

        return {
          ...c,
          aadhaar_front_url: c.aadhaar_front_url || matchingAdm?.aadhaar_front_url || null,
          aadhaar_back_url: c.aadhaar_back_url || matchingAdm?.aadhaar_back_url || null,
          pan_url: c.pan_url || matchingAdm?.pan_url || null,
          profile_photo_url: c.profile_photo_url || matchingAdm?.profile_photo_url || null,
          signature_url: c.signature_url || matchingAdm?.signature_url || null,
          video_url: c.video_url || matchingAdm?.video_url || null,
          address: c.address || matchingAdm?.address || null,
          phone: c.phone || matchingAdm?.phone || null,
          course_name: matchingAdm?.course_name || null
        };
      });

      // Also include any approved admission applicants who don't have a profile yet
      for (const adm of admissionsList) {
        if (adm.email && !mergedCandidates.some(c => c.email?.toLowerCase().trim() === adm.email?.toLowerCase().trim())) {
          mergedCandidates.push({
            id: adm.id,
            full_name: adm.full_name,
            email: adm.email,
            phone: adm.phone,
            address: adm.address,
            aadhaar_front_url: adm.aadhaar_front_url,
            aadhaar_back_url: adm.aadhaar_back_url,
            pan_url: adm.pan_url,
            profile_photo_url: adm.profile_photo_url,
            signature_url: adm.signature_url,
            video_url: adm.video_url,
            role: 'candidate',
            profile_completed: adm.status === 'approved',
            is_admission_only: true
          });
        }
      }

      setAllCandidates(mergedCandidates);

      if (id) {
        let selected = mergedCandidates.find(c => String(c.id) === String(id));
        if (!selected) {
          selected = mergedCandidates.find(c => c.email?.toLowerCase().trim() === String(id).toLowerCase().trim());
        }
        if (selected) {
          setCandidate(selected);
        } else {
          // Direct fetch fallback
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
          if (data) {
            const matchingAdm = admissionsList.find(a => a.email?.toLowerCase().trim() === data.email?.toLowerCase().trim());
            setCandidate({
              ...data,
              aadhaar_front_url: data.aadhaar_front_url || matchingAdm?.aadhaar_front_url || null,
              aadhaar_back_url: data.aadhaar_back_url || matchingAdm?.aadhaar_back_url || null,
              pan_url: data.pan_url || matchingAdm?.pan_url || null,
              profile_photo_url: data.profile_photo_url || matchingAdm?.profile_photo_url || null,
              signature_url: data.signature_url || matchingAdm?.signature_url || null,
              video_url: data.video_url || matchingAdm?.video_url || null,
              address: data.address || matchingAdm?.address || null,
              phone: data.phone || matchingAdm?.phone || null
            });
          } else {
            setCandidate(null);
          }
        }
      } else {
        // No ID selected in URL -> display the Candidate Cards Directory View
        setCandidate(null);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err.message || 'Profile fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const getCandidateProgress = (c) => {
    if (!c?.id) return { stepCount: 1, percent: 11, isCompleted: false };
    const storageKey = `service_delivery_steps_${c.id}`;
    const saved = localStorage.getItem(storageKey);
    let stepCount = 0;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) stepCount = parsed.length;
      } catch (e) {}
    } else if (c.service_delivery_steps && Array.isArray(c.service_delivery_steps)) {
      stepCount = c.service_delivery_steps.length;
    } else if (c.profile_completed || (c.aadhaar_front_url && c.aadhaar_back_url)) {
      stepCount = 9;
    } else {
      stepCount = 1;
    }
    const percent = Math.min(100, Math.round((stepCount / 9) * 100));
    const isCompleted = stepCount >= 9;
    return { stepCount, percent, isCompleted };
  };

  const isKycCompleted = !!(
    candidate?.profile_completed ||
    (candidate?.profile_photo_url && candidate?.aadhaar_front_url && candidate?.aadhaar_back_url)
  );

  // Load saved step status for single candidate stepper view
  useEffect(() => {
    if (!candidate?.id) return;
    const storageKey = `service_delivery_steps_${candidate.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedSteps(new Set(parsed));
          return;
        }
      } catch (e) {}
    }

    if (candidate.service_delivery_steps && Array.isArray(candidate.service_delivery_steps)) {
      setCompletedSteps(new Set(candidate.service_delivery_steps));
    } else {
      if (isKycCompleted) {
        setCompletedSteps(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
      } else {
        setCompletedSteps(new Set([1]));
      }
    }
  }, [candidate?.id, isKycCompleted]);

  // Toggle steps cumulatively up to clicked step
  const handleToggleStep = (stepId) => {
    setCompletedSteps(prev => {
      let nextArr = [];
      const currentHighest = Math.max(0, ...Array.from(prev));
      if (currentHighest === stepId && prev.has(stepId)) {
        for (let i = 1; i < stepId; i++) {
          nextArr.push(i);
        }
      } else {
        for (let i = 1; i <= stepId; i++) {
          nextArr.push(i);
        }
      }

      const next = new Set(nextArr);
      if (candidate?.id) {
        localStorage.setItem(`service_delivery_steps_${candidate.id}`, JSON.stringify(nextArr));
        supabase
          .from('profiles')
          .update({ service_delivery_steps: nextArr })
          .eq('id', candidate.id)
          .then(() => {});
      }
      return next;
    });
  };

  const handleSelectCandidate = (newId) => {
    if (newId) {
      navigate(`/admin/servicedelivery/${newId}`);
    } else {
      navigate('/admin/servicedelivery');
    }
  };

  // Filter candidates for Cards Directory View
  const filteredCandidates = allCandidates.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const { isCompleted } = getCandidateProgress(c);
    if (statusFilter === 'completed') return isCompleted;
    if (statusFilter === 'in_progress') return !isCompleted;
    return true;
  });

  const completedCount = allCandidates.filter(c => getCandidateProgress(c).isCompleted).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading Service Delivery...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: CANDIDATE CARDS DIRECTORY VIEW (When no candidate id is in URL)
  // =========================================================================
  if (!id || !candidate) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 font-sans animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Title & Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-slate-900 uppercase">
                Service Delivery Management
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Track and manage candidate 12-stage service delivery lifecycle
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm">
                TOTAL <span className="font-black text-slate-900 ml-1.5">{allCandidates.length}</span>
              </div>
              <div className="px-5 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                COMPLETED <span className="font-black text-emerald-900 ml-1">{completedCount}</span>
              </div>
            </div>
          </div>

          {/* Search Bar & Status Filter Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, email or phone.."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  statusFilter === 'all' 
                    ? 'bg-slate-950 text-white shadow-md' 
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm'
                }`}
              >
                ALL ({allCandidates.length})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  statusFilter === 'completed' 
                    ? 'bg-slate-950 text-white shadow-md' 
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm'
                }`}
              >
                COMPLETED
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  statusFilter === 'in_progress' 
                    ? 'bg-slate-950 text-white shadow-md' 
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm'
                }`}
              >
                IN PROGRESS
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCandidates.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 text-2xl">
                🔍
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Candidates Found</h3>
              <p className="text-slate-400 text-xs">No matching candidate was found for your query or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map(c => {
                const { stepCount, percent, isCompleted } = getCandidateProgress(c);

                return (
                  <div 
                    key={c.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] p-6 space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Avatar & Status Badge */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-[#801424] flex items-center justify-center text-white font-black text-lg shadow-md overflow-hidden">
                            {c.profile_photo_url ? (
                              <img src={c.profile_photo_url} alt={c.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{getInitials(c.full_name)}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-sm">
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          isCompleted 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                          {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                        </span>
                      </div>

                      {/* Candidate Name & Contact Details */}
                      <div className="space-y-1">
                        <h3 className="font-black text-lg text-slate-900 tracking-tight uppercase truncate">
                          {c.full_name || 'Candidate Name'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 text-slate-400">
                            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                          </svg>
                          <span className="truncate">{c.email}</span>
                        </p>
                        {c.phone && (
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate pt-0.5">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 text-rose-500">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span className="truncate">{c.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & View Stepper CTA */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800">{stepCount}/9 Delivered • PC verified</span>
                          <span className="text-emerald-600 font-extrabold">{percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => navigate(`/admin/servicedelivery/${c.id}`)}
                        className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
                      >
                        <span>VIEW LIVE STEPPER</span>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="transition-transform group-hover:translate-x-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DETAILED LIVE STEPPER VIEW (When a candidate is selected)
  // =========================================================================
  const maxStep = steps.reduce((max, s) => completedSteps.has(s.id) ? Math.max(max, s.id) : max, 0);
  const progressPercent = completedSteps.size === 9 ? 100 : maxStep === 0 ? 0 : Math.round(((maxStep - 1) / (steps.length - 1)) * 100);

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 font-sans animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Controls: Back to Candidate Cards & Candidate Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button 
            type="button"
            onClick={() => navigate('/admin/servicedelivery')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm hover:shadow transition-all group cursor-pointer"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>BACK TO CANDIDATE CARDS</span>
          </button>

          {allCandidates.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate:</span>
              <select 
                value={candidate?.id || ''} 
                onChange={(e) => handleSelectCandidate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer pr-2 max-w-[280px] truncate"
              >
                {allCandidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || 'Candidate'} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* HERO CARD: 9-Step Service Delivery (Interactive Clickable Steps) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-8 md:p-12 relative overflow-hidden">
          
          {/* Card Top: Candidate Info, Title, Status */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-10 border-b border-slate-100/80">
            {/* Left: Avatar + Candidate Details */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="w-16 h-16 rounded-full bg-[#801424] border-2 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                {candidate.profile_photo_url ? (
                  <img src={candidate.profile_photo_url} alt={candidate.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-xl tracking-wider">
                    {getInitials(candidate.full_name)}
                  </span>
                )}
              </div>
              <div className="truncate">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">
                  {candidate.full_name || 'Candidate Name'}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5 truncate">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="truncate">{candidate.email}</span>
                </div>
              </div>
            </div>

            {/* Center: Title */}
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Service Delivery
              </h1>
            </div>

            {/* Right: Status Pill */}
            <div className="shrink-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">STATUS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-xs font-black tracking-tight text-emerald-700">
                  Milestones: {completedSteps.size}/9
                </span>
              </div>
            </div>
          </div>

          {/* 9 Interactive Steps Horizontal Track */}
          <div className="pt-10 overflow-x-auto pb-6 scrollbar-thin">
            <div className="min-w-[950px] px-6 relative">
              
              {/* Progress Line */}
              <div className="absolute top-[48px] left-[65px] right-[65px] h-[3px] bg-slate-200 -z-0">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400 transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 9 Stepper Nodes */}
              <div className="relative flex items-start justify-between">
                {steps.map((step) => {
                  const isCompleted = completedSteps.has(step.id);

                  return (
                    <div 
                      key={step.id} 
                      onClick={() => handleToggleStep(step.id)}
                      className="flex flex-col items-center group cursor-pointer w-28 shrink-0 select-none transition-transform active:scale-95"
                    >
                      {/* Step Number Top Badge */}
                      <span className={`text-[10px] font-black uppercase tracking-wider mb-2 transition-colors ${
                        isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.id}
                      </span>

                      {/* Circular Node */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 relative z-10 border-2 ${
                        isCompleted 
                          ? 'bg-emerald-500 border-white text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)] scale-110' 
                          : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:scale-105'
                      }`}>
                        {isCompleted ? (
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{step.id}</span>
                        )}
                      </div>

                      {/* Step Label Bottom */}
                      <div className="mt-4 text-center">
                        <p className={`text-[11px] leading-tight font-black transition-colors ${
                          isCompleted ? 'text-slate-900 font-extrabold' : 'text-slate-400 group-hover:text-slate-600'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Milestone Verification List & Verification Documents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Milestone Verification Checkbox List */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Milestone Verification</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {completedSteps.size}/9 Active
              </span>
            </div>

            <div className="space-y-2">
              {[
                { id: 1, label: "Step 01: Admission Confirmation" },
                { id: 2, label: "Step 02: Document KYC Verification" },
                { id: 3, label: "Step 03: Video KYC Authentication" },
                { id: 4, label: "Step 04: GST Invoice Delivered" },
                { id: 5, label: "Step 05: PDF Study Material Shared" },
                { id: 6, label: "Step 06: Enrollment Certificate Issued" },
                { id: 7, label: "Step 07: Video Lectures Delivered" },
                { id: 8, label: "Step 08: Final Exam Login Shared" },
                { id: 9, label: "Step 09: Result & PC Delivered" }
              ].map((item) => {
                const isChecked = completedSteps.has(item.id);
                return (
                  <button 
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleStep(item.id)}
                    className="w-full flex items-center justify-between py-2 px-3 bg-slate-50/60 hover:bg-slate-100 rounded-xl border border-slate-100/80 text-xs transition-all text-left cursor-pointer group"
                  >
                    <span className={`font-semibold transition-colors ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isChecked 
                        ? 'bg-emerald-50 text-emerald-500 border-emerald-200 shadow-sm' 
                        : 'bg-white text-slate-300 border-slate-200 group-hover:border-emerald-300 group-hover:text-emerald-400'
                    }`}>
                      {isChecked ? (
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-emerald-400" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2 & 3: Uploaded Identity Assets */}
          <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Identity & Verification Assets</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Aadhaar Front", url: candidate.aadhaar_front_url },
                { label: "Aadhaar Back", url: candidate.aadhaar_back_url },
                { label: "Digital Signature", url: candidate.signature_url },
                ...(candidate.pan_url ? [{ label: "PAN Card", url: candidate.pan_url }] : []),
                ...(candidate.profile_photo_url ? [{ label: "Profile Photo", url: candidate.profile_photo_url }] : [])
              ].map((doc, idx) => (
                <div key={idx} className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">{doc.label}</span>
                  {doc.url ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200/80 aspect-[1.4] bg-slate-50 flex items-center justify-center shadow-inner">
                      {doc.url.toLowerCase().includes('.pdf') ? (
                        <div className="flex flex-col items-center gap-1.5 p-4 text-slate-400">
                          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                          <span className="text-[10px] font-bold uppercase tracking-wider">PDF Document</span>
                        </div>
                      ) : (
                        <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                      )}
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 gap-1.5 font-bold text-xs"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        Inspect
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-100 aspect-[1.4] flex items-center justify-center text-slate-300">
                      <span className="text-[10px] font-black uppercase tracking-wider">Not Uploaded</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Video Verification Statement if available */}
            {candidate.video_url && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">📹 Live Video KYC Statement</span>
                <div className="relative rounded-xl overflow-hidden bg-black max-w-sm aspect-video flex items-center justify-center">
                  <video src={candidate.video_url} controls className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* Quick Profile Summary Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-medium">
                Candidate ID: <code className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{candidate.id?.slice(0, 8)}...</code>
              </span>
              <div className="flex gap-2">
                <Link to={`/admin/users/edit/${candidate.id}`}>
                  <button className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs transition-colors cursor-pointer">
                    Edit Candidate
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ServiceDeliveryManager;
