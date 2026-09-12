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

  // Set of checked step IDs (1 to 9)
  const [completedSteps, setCompletedSteps] = useState(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));

  useEffect(() => {
    fetchCandidates();
  }, [id]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data: candidatesList, error: listError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'candidate')
        .order('full_name', { ascending: true });

      if (listError) throw listError;
      setAllCandidates(candidatesList || []);

      if (id) {
        const selected = (candidatesList || []).find(c => c.id === id);
        if (selected) {
          setCandidate(selected);
        } else {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw error;
          setCandidate(data);
        }
      } else if (candidatesList && candidatesList.length > 0) {
        setCandidate(candidatesList[0]);
      } else {
        setCandidate(null);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err.message || 'Profile fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const isKycCompleted = !!(
    candidate?.profile_completed ||
    (candidate?.profile_photo_url && candidate?.aadhaar_front_url && candidate?.aadhaar_back_url)
  );

  // Load saved step status from localStorage or candidate record
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
      // Default: if KYC verified, all 9 checked; else check first step
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
      // If clicking the current highest milestone, step back by 1
      if (currentHighest === stepId && prev.has(stepId)) {
        for (let i = 1; i < stepId; i++) {
          nextArr.push(i);
        }
      } else {
        // Check all milestones from 1 up to stepId
        for (let i = 1; i <= stepId; i++) {
          nextArr.push(i);
        }
      }

      const next = new Set(nextArr);
      if (candidate?.id) {
        localStorage.setItem(`service_delivery_steps_${candidate.id}`, JSON.stringify(nextArr));
        // Silently update Supabase profile if possible
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
    navigate(`/admin/servicedelivery/${newId}`);
  };

  // Calculate highest step checked for gradient line width
  const maxStep = steps.reduce((max, s) => completedSteps.has(s.id) ? Math.max(max, s.id) : max, 0);
  const progressPercent = completedSteps.size === 9 ? 100 : maxStep === 0 ? 0 : Math.round(((maxStep - 1) / (steps.length - 1)) * 100);

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

  if (error || !candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 font-sans px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-lg">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">No Candidate Selected</h2>
          <p className="text-slate-400 text-sm max-w-sm">Please select a candidate from your directory to view their service delivery milestones.</p>
        </div>
        <Link to="/admin/users">
          <button className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-full text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            Back to Candidates
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 font-sans animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Controls: Back Button & Candidate Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link 
            to="/admin/users" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm hover:shadow transition-all group"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>BACK TO CANDIDATE CARDS</span>
          </Link>

          {allCandidates.length > 1 && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate:</span>
              <select 
                value={candidate?.id || ''} 
                onChange={(e) => handleSelectCandidate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer pr-2"
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                {candidate.profile_photo_url ? (
                  <img src={candidate.profile_photo_url} alt={candidate.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-700 font-black text-xl tracking-wider">
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
            <div className="flex items-center shrink-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/80 border border-emerald-200 text-emerald-800 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">STATUS</span>
                <span className={`w-2 h-2 rounded-full ${completedSteps.size === 9 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`} />
                <span className="text-xs font-black tracking-tight text-emerald-700">
                  {completedSteps.size === 9 ? 'Service Delivery Completed' : `Milestones: ${completedSteps.size}/9`}
                </span>
              </div>
            </div>
          </div>

          {/* 9 Live Steps Progress Timeline (Clickable) */}
          <div className="pt-8 overflow-x-auto pb-6 scrollbar-thin">
            <div className="min-w-[950px] px-6 relative">
              
              {/* Background & Progress Gradient Track */}
              <div className="absolute top-[48px] left-[65px] right-[65px] h-[3px] bg-slate-200 -z-0">
                <div 
                  className="h-full transition-all duration-500 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 9 Milestone Columns */}
              <div className="relative flex items-start justify-between">
                {steps.map((step) => {
                  const isChecked = completedSteps.has(step.id);

                  return (
                    <button
                      key={step.id} 
                      type="button"
                      onClick={() => handleToggleStep(step.id)}
                      title={`Step ${step.id}: ${step.label} (${isChecked ? 'Completed' : 'Click to complete up to this step'})`}
                      className="flex flex-col items-center text-center w-24 relative z-10 group/step cursor-pointer outline-none transition-transform active:scale-95"
                    >
                      
                      {/* Top Step Number Circle */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-300 bg-white ${
                        isChecked 
                          ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-sm' 
                          : 'border-slate-300 text-slate-400 group-hover/step:border-emerald-400 group-hover/step:text-emerald-600'
                      }`}>
                        {step.id}
                      </div>

                      {/* Vertical Drop Connector */}
                      <div className={`w-[2px] h-3.5 transition-colors duration-300 ${
                        isChecked ? 'bg-emerald-500' : 'bg-slate-300 group-hover/step:bg-emerald-300'
                      }`} />

                      {/* Main Track Node (Green Checkmark when Checked) */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white transition-all duration-300 shadow-md ${
                        isChecked 
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-105 group-hover/step:scale-110' 
                          : 'bg-white border-2 border-slate-300 text-slate-300 group-hover/step:border-emerald-400 group-hover/step:bg-emerald-50/50 group-hover/step:text-emerald-500 group-hover/step:scale-105'
                      }`}>
                        {isChecked ? (
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="opacity-0 group-hover/step:opacity-100 transition-opacity">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Step Label */}
                      <p className={`mt-4 text-[11px] font-bold capitalize tracking-tight leading-snug max-w-[95px] break-words transition-colors duration-300 ${
                        isChecked ? 'text-slate-900 font-black' : 'text-slate-400 font-medium group-hover/step:text-slate-700'
                      }`}>
                        {step.label}
                      </p>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

        {/* DETAILS SECTION: KYC Deliverables & Upload Previews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Card 1: Deliverables Checklist (Also Clickable) */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Milestone Verification</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
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
                { label: "Digital Signature", url: candidate.signature_url }
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

            {/* Quick Profile Summary Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-medium">
                Candidate ID: <code className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{candidate.id?.slice(0, 8)}...</code>
              </span>
              <div className="flex gap-2">
                <Link to={`/admin/users/edit/${candidate.id}`}>
                  <button className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs transition-colors">
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
