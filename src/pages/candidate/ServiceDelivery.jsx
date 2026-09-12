import React from 'react';

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

const ServiceDelivery = ({ profile }) => {
  const isKycCompleted = !!(
    profile?.profile_completed ||
    (profile?.profile_photo_url && profile?.aadhaar_front_url && profile?.aadhaar_back_url)
  );

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 font-sans animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Main 9-Step Service Delivery Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-8 md:p-12 relative overflow-hidden">
          
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-12 border-b border-slate-100/80">
            {/* Left: Candidate Profile */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-700 font-black text-xl tracking-wider">
                    {getInitials(profile?.full_name)}
                  </span>
                )}
              </div>
              <div className="truncate">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">
                  {profile?.full_name || 'Candidate Name'}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5 truncate">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="truncate">{profile?.email}</span>
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
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50/80 border border-emerald-200 text-emerald-800 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">STATUS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-xs font-black tracking-tight text-emerald-700">
                  {isKycCompleted ? 'Service Delivery Completed' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>

          {/* 9 Live Steps Progress Timeline */}
          <div className="pt-10 overflow-x-auto pb-4 scrollbar-thin">
            <div className="min-w-[950px] px-6 relative">
              
              {/* Background & Progress Gradient Track */}
              <div className="absolute top-[48px] left-[65px] right-[65px] h-[3px] bg-slate-200 -z-0">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    isKycCompleted 
                      ? 'w-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                      : 'w-1/3 bg-gradient-to-r from-purple-500 to-blue-500'
                  }`} 
                />
              </div>

              {/* 9 Milestone Columns */}
              <div className="relative flex items-start justify-between">
                {steps.map((step) => {
                  const isCompleted = isKycCompleted || step.id <= 3;

                  return (
                    <div key={step.id} className="flex flex-col items-center text-center w-24 relative z-10 group">
                      
                      {/* Top Step Number Circle */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500 bg-white ${
                        isCompleted 
                          ? 'border-emerald-500 text-emerald-600 shadow-sm' 
                          : 'border-slate-300 text-slate-400'
                      }`}>
                        {step.id}
                      </div>

                      {/* Vertical Drop Connector */}
                      <div className={`w-[2px] h-3.5 transition-colors duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-slate-300'
                      }`} />

                      {/* Main Track Node (Green Checkmark) */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white transition-all duration-500 shadow-md ${
                        isCompleted 
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-105' 
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        )}
                      </div>

                      {/* Step Label */}
                      <p className={`mt-4 text-[11px] font-bold capitalize tracking-tight leading-snug max-w-[95px] break-words transition-colors duration-500 ${
                        isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ServiceDelivery;
