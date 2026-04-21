import React, { useState } from 'react';
import supabase from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const DisclaimerOverlay = ({ user, profile }) => {
  const [disclaimerCheckbox, setDisclaimerCheckbox] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Visibility Logic
  const userId = user?.id || profile?.id;
  const isSessionAccepted = sessionStorage.getItem(`disclaimer_accepted_${userId}`);

  // Only show if not accepted in profile AND not accepted in current session
  const showOverlay = !((profile?.disclaimer_accepted === true && profile?.profile_completed === true) || isSessionAccepted);

  if (!showOverlay) {
    return null; 
  }

  const handleAccept = async () => {
    if (!disclaimerCheckbox) return;
    setIsAccepting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ disclaimer_accepted: true })
        .eq('id', userId);
      if (error) throw error;
      
      sessionStorage.setItem(`disclaimer_accepted_${userId}`, 'true');
      
      // Short delay for the animation to feel smooth before reload/hide
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('Error accepting disclaimer:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  const sections = [
    {
      title: "1. Service Delivery / Platform",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      color: "bg-blue-500",
      points: [
        "One attempt allowed for Pre-Board and Final exams",
        "Soft copy certificate issued within 15 days after final exam",
        "No physical certificate (only digital)",
        {
          subTitle: "Pre-Exam Reward System:",
          subPoints: [
            "80%+ score = eligible for rewards",
            "5+ gift options (₹50K–₹1L range)",
            "Delivery in 45–60 days",
            "Tracking shared via email",
            "OTP required for delivery",
            "Company may use student photos for promotion"
          ]
        }
      ]
    },
    {
      title: "2. Privacy Policy",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.565 3.194 10.385 7.79 12.512a11.97 11.97 0 007.625 0c4.596-2.127 7.79-6.947 7.79-12.512 0-1.297-.205-2.545-.598-3.714A11.959 11.959 0 0112 2.714z" />
        </svg>
      ),
      color: "bg-emerald-500",
      points: [
        "Data used for enrollment, payments, exams, communication, and improvement",
        "Data is NOT sold or shared commercially",
        "Stored securely with encryption and limited access",
        "Payment data handled securely",
        "Cookies used for login and analytics",
        "Data retained only as needed",
        "Users can access, correct, or delete their data",
        "Policy updates may occur anytime"
      ]
    },
    {
      title: "3. Terms & Conditions",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      color: "bg-amber-500",
      points: [
        "One attempt allowed for exams",
        "Certificate issued after final exam",
        "Refund rules apply (see below)",
        "Reward system based on performance (80%+)"
      ]
    },
    {
      title: "4. Refund Policy",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3m1.5 3l3-3m-6.75 3H5.25a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5a2.25 2.25 0 01-2.25 2.25h-3" />
        </svg>
      ),
      color: "bg-rose-500",
      points: [
        "No refund after exam attempt or content access",
        "Refund allowed only within 24 hours of payment",
        "90% refund (10% deduction mandatory)",
        "Processing time: 5–7 working days (+7 days bank time)",
        "Request must include name, email, course, receipt, and reason",
        "No 100% refund under any condition"
      ]
    }
  ];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md font-sans"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
        >
          
          {/* Decorative Background Blob */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-center justify-between shrink-0 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
                <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.565 3.194 10.385 7.79 12.512a11.97 11.97 0 007.625 0c4.596-2.127 7.79-6.947 7.79-12.512 0-1.297-.205-2.545-.598-3.714A11.959 11.959 0 0112 2.714z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Elitetoolistic Policies</h2>
                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.2em] mt-2">Official Platform Governance</p>
              </div>
            </div>
            <div className="hidden md:block px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Required Agreement
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar relative z-10">
            <div className="space-y-10">
              
              {sections.map((section, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="relative pl-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${section.color} text-white flex items-center justify-center shadow-md`}>
                      {section.icon}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{section.title}</h3>
                  </div>
                  
                  <div className="space-y-3 ml-11">
                    {section.points.map((point, pIdx) => (
                      typeof point === 'string' ? (
                        <div key={pIdx} className="flex gap-3 text-sm text-slate-600 font-medium leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                          {point}
                        </div>
                      ) : (
                        <div key={pIdx} className="mt-4 space-y-3">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-wider">{point.subTitle}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            {point.subPoints.map((sub, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2 text-[12px] text-slate-500 font-bold bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                <svg className="text-primary-500 shrink-0" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {sub}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Final Key Points Summary */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-primary-50/50 border border-primary-100 rounded-3xl p-6"
              >
                <h4 className="text-xs font-black text-primary-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                  Final Key Points
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Strict no-refund after usage",
                    "Short refund window (24 hours)",
                    "Digital-only system",
                    "Performance-based rewards",
                    "Strong data protection policies"
                  ].map((keyPoint, kpIdx) => (
                    <span key={kpIdx} className="px-3 py-1.5 bg-white rounded-full text-[11px] font-black text-primary-700 shadow-sm border border-primary-100">
                      • {keyPoint}
                    </span>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>

          {/* Actions - Fixed Footer */}
          <div className="px-8 py-8 border-t border-slate-100 bg-white/50 shrink-0 relative z-10">
            <div className="flex flex-col gap-6">
              <label className="flex items-center gap-4 cursor-pointer group px-4 py-3 rounded-2xl transition-all hover:bg-slate-50">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={disclaimerCheckbox}
                    onChange={(e) => setDisclaimerCheckbox(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-2 border-slate-200 text-primary-600 focus:ring-primary-600/20 transition-all cursor-pointer"
                  />
                </div>
                <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                  I have read and agree to all the <span className="text-primary-600 font-black underline decoration-primary-600/20 underline-offset-4">Elitetoolistic Platform Policies</span>.
                </span>
              </label>

              <button
                onClick={handleAccept}
                disabled={!disclaimerCheckbox || isAccepting}
                className={`w-full py-5 rounded-[1.25rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-500 overflow-hidden relative ${
                  disclaimerCheckbox && !isAccepting
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-2xl shadow-primary-600/30 hover:scale-[1.01] hover:shadow-primary-600/50'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isAccepting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Agreement...</span>
                  </div>
                ) : (
                  <>
                    <span>Confirm & Accept Agreement</span>
                    <svg className="transition-transform group-hover:translate-x-1" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DisclaimerOverlay;
