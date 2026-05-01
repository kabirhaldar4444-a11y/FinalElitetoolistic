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
      title: "1. Service Delivery",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      color: "bg-blue-500",
      points: [
        {
          subTitle: "Enrollment Process",
          subPoints: [
            "Customers visit the Elitetoolistic website and fill out the Enrollment Form.",
            "After form submission, Our team connects with the customer.",
            "A detailed email is shared explaining the complete process flow and fee structure. Payments may also be accepted directly through an authorized professional expert trainer account, where applicable."
          ]
        },
        {
          subTitle: "Process Explanation & Confirmation",
          subPoints: [
            "During the call, the team explains the course structure, learning journey, and assessment-to-certification flow.",
            "The customer then confirms their participation in the program."
          ]
        },
        {
          subTitle: "Fee Payment",
          subPoints: [
            "Upon successful completion of the fee payment, a GST-compliant invoice is issued within 6 hours.",
            "Pre-examination study materials are shared with the learner within 24 hours."
          ]
        },
        {
          subTitle: "Pre-Exam",
          subPoints: [
            "A Pre-Exam is conducted within 24–48 hours of fee payment.",
            "This exam assesses the customer’s initial understanding of the selected domain.",
            "Before the exam, the Guidance Team connects to explain the exam process."
          ]
        },
        {
          subTitle: "Pre-Exam Result & Pre-Board Professional Certificate",
          subPoints: [
            "Results are shared within 24–48 hours via email.",
            "A Pre-Board Professional Certificate is issued with “Under Training” mentioned."
          ]
        },
        {
          subTitle: "Reward Eligibility",
          subPoints: [
            "Customers scoring above 80% become eligible for a gift.",
            "One gift can be selected from four available options, which will be delivered accordingly."
          ]
        },
        {
          subTitle: "Self-Paced Training",
          subPoints: [
            "Access to recorded video lectures is shared within 15 days on payment.",
            "Training duration is 90–120 days."
          ]
        },
        {
          subTitle: "Final Exam",
          subPoints: [
            "A Final Exam is conducted between 90-120 days."
          ]
        },
        {
          subTitle: "Final Certificate",
          subPoints: [
            "Upon successful completion of all requirements, the Final Certificate is issued.",
            "The certificate will clearly state the status as “Certified.”"
          ]
        },
        {
          subTitle: "Continuous Support",
          subPoints: [
            "Throughout the entire journey, the Elitetoolistic team remains in contact for guidance and support."
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
        {
          subTitle: "Information We Collect",
          subPoints: [
            "Personal Information: Your name, email address, contact number, and country of residence collected during registration or inquiries.",
            "Payment Information: Transaction details (amount, date, and payment method). We do not store complete payment card or crypto wallet details.",
            "Course and Usage Data: Information about the courses you enroll in, your progress, assessments, and interactions with our online learning platform.",
            "Technical Information: Device type, IP address, browser version, and cookies to improve website performance and user experience."
          ]
        },
        {
          subTitle: "How We Use Your Information",
          subPoints: [
            "Process your course enrollment and payments.",
            "Provide access to study materials, exams, and course completion certificates.",
            "Communicate important updates, reminders, and support-related information.",
            "Improve course quality, website functionality, and user experience.",
            "Maintain compliance with our internal policies and applicable laws.",
            "We do not sell, trade, or rent your personal information to any third party."
          ]
        },
        {
          subTitle: "Data Storage and Security",
          subPoints: [
            "All personal data is stored securely in encrypted databases.",
            "Only authorized Elitetoolistic personnel have access to user data.",
            "We regularly update our systems and employ security measures such as SSL encryption to protect against unauthorized access, alteration, or disclosure."
          ]
        },
        {
          subTitle: "Payment & Financial Data",
          subPoints: [
            "All personal data is stored securely in encrypted databases.",
            "Only authorized Elitetoolistic personnel have access to user data.",
            "We regularly update our systems and employ security measures such as SSL encryption to protect against unauthorized access, alteration, or disclosure."
          ]
        },
        {
          subTitle: "Use of Cookies",
          subPoints: [
            "Our website uses cookies to: Enhance your browsing experience, Save login preferences, Analyze site traffic and improve user experience.",
            "You can choose to disable cookies from your browser settings; however, some website features may not function properly as a result."
          ]
        },
        {
          subTitle: "Data Retention",
          subPoints: [
            "We retain your personal information for as long as necessary to fulfill course delivery and legal obligations. Once no longer needed, your data will be securely deleted or anonymized."
          ]
        },
        {
          subTitle: "Third-Party Links",
          subPoints: [
            "Our website may contain links to third-party websites (e.g., payment gateways or educational partners). Elitetoolistic is not responsible for the privacy practices or content of these external sites."
          ]
        },
        {
          subTitle: "Your Rights",
          subPoints: [
            "You have the right to: Access the information we hold about you, Request correction or deletion of inaccurate data, Withdraw consent for marketing communications at any time.",
            "To exercise these rights, please contact our support team at support@elitetoolistic.com."
          ]
        },
        {
          subTitle: "Policy Updates",
          subPoints: [
            "Elitetoolistic OPC Pvt Ltd and PayG, reserves the right to update or modify this Privacy Policy at any time without prior notice. The revised version will be posted on our website with an updated effective date."
          ]
        }
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
        {
          subTitle: "Course Duration and Delivery",
          subPoints: [
            "The complete course will be delivered within 90 to 120 days from the date of enrollment.",
            "After enrollment, learners will receive an Invoice, Study Materials and video lectures within 10 working days of making the payment.",
            "A Pre-Board Exam will be scheduled 24 to 48 hours after payment, accessible via the official Elitetoolistic exam portal. An Initial PC Softcopy (indicating “Under Training” and course details), will be provided after going through the pre-board exam within 48 to 72 hours.",
            "The final online exam must be attended between 90 to 120 days after enrollment.",
            "Upon successful exam completion, the Final PC Softcopy will be emailed to the candidate, indicating “Successfully Certified”."
          ]
        },
        {
          subTitle: "Training Format",
          subPoints: [
            "No live training sessions will be provided.",
            "Study material and training videos will be shared once only via email after the enrollment.",
            "Training videos and study materials are non-transferable and intended solely for enrolled candidates.",
            "Upon successful completion of the program, the certificate will be released with an abbreviation format. For an example if the course you have enrolled in 'Resilience Coach Training', then 'RCT' will appear on your certificate, similarly if the course name is Decision Making Mastery Training, on the certificate it will show 'DMMT'"
          ]
        },
        {
          subTitle: "Exam Policy",
          subPoints: [
            "Multiple exam attempts are not permitted, for pre- board as well as final exam.",
            "The Final PC Softcopy will be issued within 15 days after the final exam attempt.",
            "No hard copy certificates will be delivered; all documents will be sent in digital format only."
          ]
        },
        {
          subTitle: "Refund Policy",
          subPoints: [
            "No refund will be applicable after attempting any exam (Pre-Board or Final).",
            "A 90% refund is applicable before attempting any exam.",
            "There is no 100% refund policy.",
            "A 10% deduction will apply to all refunds to cover the cost of digital study materials and content access."
          ]
        },
        {
          subTitle: "Pre-Examination Reward Policy",
          subPoints: [
            "Candidates who secure 80% or above in the designated pre-examination will be eligible to receive a complimentary gift.",
            "Eligible candidates will be provided with 5+ options for gift items worth upto 50k-100k. The final gift selection will be subject to availability and company discretion.",
            "By qualifying for the reward, candidates consent to the use and display of their photograph on the company’s official website and promotional platforms.",
            "Gift items will be dispatched within 45 to 60 days from the date of result declaration.",
            "All gifts will be accompanied by the manufacturer’s warranty, where applicable.",
            "Courier tracking details will be shared via registered email once the item has been dispatched.",
            "For delivery verification, a one-time password (OTP) required by the courier partner will be shared with the recipient by the company.",
            "The company reserves the right to modify, substitute, or discontinue the reward offer at any time without prior notice, in accordance with applicable laws and operational requirements."
          ]
        },
        {
          subTitle: "General Terms",
          subPoints: [
            "All timelines mentioned are approximate and subject to variation depending on course type and customer engagement.",
            "Study materials and videos are shared once and cannot be reissued.",
            "By enrolling, candidates agree to comply with the above terms and conditions."
          ]
        }
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
        {
          subTitle: "No Refund After Exam Attempt",
          subPoints: [
            "Once a candidate has attempted any exam — whether it is the Pre-Board Exam or the Final Exam — no refund will be applicable under any circumstances.",
            "This policy ensures the integrity of our course access and examination system, as study materials and evaluations are already utilized at that stage."
          ]
        },
        {
          subTitle: "90% Refund Before Exam Attempt",
          subPoints: [
            "If a candidate wishes to cancel their enrollment before attempting the pre-exam, they are eligible for a 90% refund of the total course fee.",
            "Refund will be only be provided if the customer raised the request within 24 hours of making the payment and they must not attend the exam otherwise no refund will be initiated to them.",
            "The refund request must be raised in writing via email to the official Elitetoolistic support team.",
            "Refund processing time is 5-7 working days once the refund request is approved it may take an additional 7 working days to get credited into the customer's bank account from which payment was made."
          ]
        },
        {
          subTitle: "No 100% Refund Policy",
          subPoints: [
            "Please note that Elitetoolistic does not offer a 100% refund under any condition.",
            "This is due to administrative, processing, and content access costs incurred upon enrollment."
          ]
        },
        {
          subTitle: "Refund Request Procedure",
          subPoints: [
            "To request a refund, the candidate must email support@elitetoolistic.com with their full name, registered email ID, course name, payment receipt, and reason for cancellation.",
            "Requests without complete details may face delays in processing."
          ]
        },
        {
          subTitle: "10% Deduction on All Refunds",
          subPoints: [
            "All approved refunds will include a 10% deduction to cover costs associated with digital content delivery, study materials, and platform usage.",
            "This deduction applies uniformly to all refund cases."
          ]
        },
        {
          subTitle: "Special Note",
          subPoints: [
            "Partial Course Completion: If a candidate has completed only a portion of the course, no refund will be issued for the remaining content.",
            "Delayed Course Progress: Refunds will not be provided due to delays in completing the course at the candidate’s own pace.",
            "Accessed Content: Once study materials, training videos, or pre-board assessments have been accessed, refunds will not be applicable.",
            "Dissatisfaction with Course Content: Refunds cannot be claimed solely based on personal preferences, expectations, or dissatisfaction with the course material."
          ]
        },
        {
          subTitle: "Agreement to Policies",
          subPoints: [
            "By enrolling in any course offered by Elitetoolistic Education, candidates acknowledge and agree to comply with all policies, terms of service, and refund rules.",
            "Enrolling confirms that the candidate has read, understood, and accepted the terms outlined in the policies, including payment, course access, exam schedules, and refund rules.",
            "Candidates are responsible for reviewing these policies prior to enrollment, as continued use of the course materials implies acceptance of all terms."
          ]
        },
        {
          subTitle: "Independent Organization",
          subPoints: [
            "Elitetoolistic (OPC) PVT. LTD. is an independent training and service provider. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with any other institute, organization, or governing body. All rights related to our services, content, and training materials are solely reserved by Elitetoolistic."
          ]
        },
        {
          subTitle: "No Guarantee of Employment or Monetary Benefit",
          subPoints: [
            "Our programs are designed for skill development and professional enhancement only. We do not guarantee any monetary benefit, job placement, promotion, or financial gain as a result of completing our training or certification programs."
          ]
        },
        {
          subTitle: "Third-Party Recommendations",
          subPoints: [
            "Elitetoolistic shall not be held responsible for any financial, personal, or professional loss incurred by customers who enroll in our services based on third-party recommendations, promotions, or representations. Any such engagement is strictly at the discretion and responsibility of the individual."
          ]
        }
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
