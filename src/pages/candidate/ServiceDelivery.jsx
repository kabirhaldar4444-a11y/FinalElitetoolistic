import React from 'react';

const steps = [
  { id: 1, label: "Candidate submitted the service enrollment" },
  { id: 2, label: "Proposal Email sent" },
  { id: 3, label: "Payment received" },
  { id: 4, label: "Invoice Sent" },
  { id: 5, label: "Study material shared" },
  { id: 6, label: "Login credentials shared" },
  { id: 7, label: "Exam Cleared" },
  { id: 8, label: "Completion Certificates Delivered" },
  { id: 9, label: "Video Lectures Delivered" },
  { id: 10, label: "Final Login Shared" },
  { id: 11, label: "Final Exam Cleared" },
  { id: 12, label: "PC verified" }
];

const ServiceDelivery = ({ profile }) => {
  const isKycCompleted = !!(
    profile?.profile_completed ||
    (profile?.profile_photo_url && profile?.aadhaar_front_url && profile?.aadhaar_back_url)
  );

  return (
    <div className="min-h-screen bg-slate-50/30 p-6 md:p-12 font-sans selection:bg-slate-100 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN: CANDIDATE CARD */}
        <div className="w-full lg:w-96 shrink-0 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.03)] p-8 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-900" />
          
          <div className="relative mb-8 mt-4">
            <div className="w-36 h-36 rounded-[3rem] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-md group-hover:scale-[1.02] transition-transform duration-500">
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-5xl font-black text-slate-800 uppercase">
                  {profile?.full_name?.charAt(0) || 'C'}
                </div>
              )}
            </div>
            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-white text-white flex items-center justify-center shadow-lg transition-colors ${isKycCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              {isKycCompleted ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase break-words max-w-full">
            {profile?.full_name || 'Candidate Name'}
          </h2>
          <p className="text-xs font-bold text-slate-400 mb-6 truncate max-w-full tracking-tight">
            {profile?.email || 'No email hash'}
          </p>

          <div className="w-full pt-6 border-t border-slate-50 flex flex-col gap-3 text-left">
            <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">KYC Status</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isKycCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                {isKycCompleted ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SERVICE DELIVERY TIMELINE */}
        <div className="flex-1 w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.03)] p-8 md:p-12">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-8 mb-10">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Service Delivery</h1>
              <p className="text-slate-400 font-medium text-sm">Real-time status updates of your onboarding & verification milestones</p>
            </div>
            
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 w-fit">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isKycCompleted ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                <span className="text-xs font-bold text-slate-800">
                  {isKycCompleted ? 'Service Delivery Completed' : 'Pending KYC Completion'}
                </span>
              </div>
            </div>
          </div>

          <div>
            {/* Desktop Timeline (Horizontal) */}
            <div className="hidden md:block overflow-x-auto pb-6 scrollbar-thin">
              <div className="relative flex items-start justify-between min-w-[1400px] py-8 px-6">
                
                <div className="absolute top-[48px] left-[60px] right-[60px] h-[3px] bg-slate-100 -z-0">
                  <div className={`h-full transition-all duration-1000 ${isKycCompleted ? 'w-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'w-0 bg-slate-200'}`} />
                </div>

                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center text-center w-32 relative z-10 group">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black tracking-tight border-2 mb-4 bg-white transition-all duration-500 ${isKycCompleted ? 'border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-300'}`}>
                      {step.id}
                    </div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white transition-all duration-500 shadow-sm ${isKycCompleted ? 'bg-emerald-500 text-white shadow-emerald-100 scale-110' : 'bg-slate-100 text-slate-300'}`}>
                      {isKycCompleted ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>

                    <p className={`mt-5 text-[10px] font-bold uppercase tracking-tight leading-snug max-w-[100px] break-words transition-colors duration-500 ${isKycCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Timeline (Vertical) */}
            <div className="md:hidden flex flex-col gap-8 relative pl-6 before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
              <div className={`absolute left-[15px] top-4 bottom-4 w-[2px] transition-all duration-1000 origin-top ${isKycCompleted ? 'scale-y-100 bg-emerald-500' : 'scale-y-0 bg-slate-200'}`} />

              {steps.map((step) => (
                <div key={step.id} className="relative flex gap-5 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white z-10 shadow-sm transition-all duration-500 ${isKycCompleted ? 'bg-emerald-500 text-white shadow-emerald-100 scale-105' : 'bg-slate-100 text-slate-300'}`}>
                    {isKycCompleted ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    ) : (
                      <span className="text-[10px] font-bold">{step.id}</span>
                    )}
                  </div>

                  <div className="flex-1 pt-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-wider block mb-1 ${isKycCompleted ? 'text-emerald-500' : 'text-slate-300'}`}>
                      Step {step.id}
                    </span>
                    <p className={`text-xs font-bold leading-normal ${isKycCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceDelivery;
