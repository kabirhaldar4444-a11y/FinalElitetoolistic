import React, { useState } from 'react';
import supabase from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const DisclaimerOverlay = ({ user, profile }) => {
  const [disclaimerCheckbox, setDisclaimerCheckbox] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Visibility Logic
  const userId = user?.id || profile?.id;
  const isSessionAccepted = sessionStorage.getItem(`disclaimer_accepted_${userId}`);

  // Only show if not accepted in current session and profile is not completed
  const showOverlay = !(profile?.profile_completed === true || isSessionAccepted);

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

      // Even if column doesn't exist yet, still proceed via sessionStorage
      // so user is never permanently stuck
      if (error) {
        console.warn('disclaimer_accepted column may be missing:', error.message);
        // Don't throw — fall through to sessionStorage save and reload
      }
      
      sessionStorage.setItem(`disclaimer_accepted_${userId}`, 'true');
      
      // Short delay for the animation to feel smooth before reload/hide
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('Error accepting disclaimer:', err);
      // Fallback: use sessionStorage so user can still proceed
      sessionStorage.setItem(`disclaimer_accepted_${userId}`, 'true');
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } finally {
      setIsAccepting(false);
    }
  };

  const sections = [
    {
      title: "1. Service Delivery Protocol",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      color: "bg-blue-500",
      points: [
        {
          subTitle: "Systematic Execution Architecture",
          subPoints: [
            "All digital services delivered by ELITE TOOLISTIC are tracked, timestamped, and verified across nine sequential fulfillment milestones."
          ]
        },
        {
          subTitle: "Step 01: Immediate Admission Confirmation After Payment",
          subPoints: [
            "The student onboarding journey begins instantly upon checkout. As soon as a transaction clears our secure platform gateways, our backend servers trigger an Automated Admission Confirmation Notice.",
            "Students receive a digital welcome package containing their permanent user profile IDs, platform workspace access routes, and an overview map of their target educational tracks."
          ]
        },
        {
          subTitle: "Step 02: Mandatory Document KYC Verification",
          subPoints: [
            "In strict compliance with structural risk management policies, all enrolled learners must verify their commercial profile data.",
            "Students are required to securely upload their valid identity documentation (such as government-issued photo IDs or institutional cards) to our encrypted verification portal. This step ensures that final completion documentation matches legal corporate profiles accurately."
          ]
        },
        {
          subTitle: "Step 03: Secure Video KYC Authentication",
          subPoints: [
            "To prevent platform identity theft, proxy testing, and transaction chargeback vectors, students must execute an automated Video KYC Verification step.",
            "Using an integrated web interface, learners record a brief, self-directed biometric identity check matching their uploaded documents. This establishes an unalterable audit trail for security purposes."
          ]
        },
        {
          subTitle: "Step 04: System Generation & Delivery of GST Invoice",
          subPoints: [
            "Accountability and fiscal transparency are foundational to our services.",
            "Within 24 hours of successful verification, our accounting systems compile a comprehensive, legally compliant Corporate GST Invoice detailing the exact service breakdown and tax identifiers. This asset is dispatched straight to the student’s billing tab for corporate tax deduction filing purposes."
          ]
        },
        {
          subTitle: "Step 05: Dissemination of Comprehensive PDF Study Material (Strict One-Time Release)",
          subPoints: [
            "Upon successful verification, the complete independent text registry library is unlocked. Students receive high-fidelity, comprehensive PDF Study Materials and Text Workbooks tailored strictly to their curriculum.",
            "Operational Security Notice: In accordance with our digital asset protection protocols, all reading materials are shared on a strict one-time basis only. Students must securely download and save these assets immediately upon distribution, as link refreshes or secondary file dispatches will not be granted."
          ]
        },
        {
          subTitle: "Step 06: Issuance of Formal Training Enrollment Certificate",
          subPoints: [
            "Before course modules begin, our records registry generates a formal, verifiable ELITE TOOLISTIC Enrollment Certificate.",
            "This initial credential serves as an active commercial proof of status, reflecting that the individual is currently under training within an active, non-affiliated skill development boot camp."
          ]
        },
        {
          subTitle: "Step 07: Access Provisioning for Video Lecture Sessions (Strict One-Time Release)",
          subPoints: [
            "Learners gain access to their master collection of high-definition, pre-recorded visual walkthroughs and technical screen-shares. These professional Video Lectures contain the entirety of the execution-level core methodologies.",
            "Operational Security Notice: In line with platform distribution rules, access keys to the video lecture sets are shared on a strict one-time basis only. Re-sharing, profile splitting, or secondary video deliveries are completely restricted to safeguard content parameters."
          ]
        },
        {
          subTitle: "Step 08: Distribution of Final Examination Login Credentials",
          subPoints: [
            "Once the 10-day, 20-day, or 30-day curriculum timeline has elapsed, the student workspace triggers the final evaluation phase.",
            "The platform outputs unique, encrypted Final Exam Login Credentials directly to the student portal, giving them an isolated access window to complete their timed, multiple-choice evaluation independently."
          ]
        },
        {
          subTitle: "Step 09: Final Exam Result Processing & Delivery with Provisional Certificate (PC)",
          subPoints: [
            "Upon completing the examination, our grading engines parse the submission data against metric matrices. The comprehensive Final Exam Result Sheet is computed and displayed instantly inside the dashboard.",
            "Graduates are immediately issued their verified Provisional Certificate (PC), closing out the service lifecycle and enabling immediate skill deployment in the corporate sector."
          ]
        }
      ]
    },
    {
      title: "2. Privacy Policy & Data Governance",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.565 3.194 10.385 7.79 12.512a11.97 11.97 0 007.625 0c4.596-2.127 7.79-6.947 7.79-12.512 0-1.297-.205-2.545-.598-3.714A11.959 11.959 0 0112 2.714z" />
        </svg>
      ),
      color: "bg-emerald-500",
      points: [
        {
          subTitle: "Framework & Scope",
          subPoints: [
            "This Privacy Policy governs the data collection, storage, processing, and security practices of ELITE TOOLISTIC (operating through its asynchronous educational infrastructure platform at https://www.elitetoolistic.com).",
            "To deliver independent vocational training programs, identity verification services, and verifiable institutional credentials, ELITE TOOLISTIC must handle specific personal and biometric data. By registering an account, making a purchase, or completing security verification steps, you explicitly consent to the collection, processing, and retention practices outlined in this policy."
          ]
        },
        {
          subTitle: "Personal Identification Data",
          subPoints: [
            "Registration & Contact Information: Full legal name, billing address, phone number, and corporate email address collected during checkout or sign-up.",
            "Fiscal Identity: Information required to generate corporate accounts, including corporate entity names and specific tax identifiers."
          ]
        },
        {
          subTitle: "Mandatory KYC & Security Verification Data",
          subPoints: [
            "Documentary Identity (Document KYC): Images or digital files of valid government-issued photo identification cards or institutional credential badges uploaded securely to our portal.",
            "Biometric Identity (Video KYC): Self-directed, brief video records processed through an integrated web interface to execute facial matching against submitted documentation and to eliminate proxy testing."
          ]
        },
        {
          subTitle: "Academic & Technical Workspace Logs",
          subPoints: [
            "Evaluation Records: Answers, responses, submission timestamps, and performance metrics parsed by our grading matrices during automated final examinations.",
            "System & Backend Server Logs: Unique workspace access keys, internet protocol (IP) address mapping, browser data, and precise file-download timestamps related to the release of text libraries and video lecture elements."
          ]
        },
        {
          subTitle: "Purpose of Processing",
          subPoints: [
            "Identity Verification & Anti-Fraud: Cross-referencing your biometric Video KYC data with your submitted physical document profile to establish an unalterable audit trail, eliminating proxy test-taking and financial transaction theft.",
            "Service Fulfillment: Provisioning individual profiles with unique access keys to streaming lecture workspaces, digital text repositories, and encrypted final examination modules.",
            "Credential Issuance: Generating accurate legal profiles for formal, verifiable documents, including initial Enrollment Certificates and final Provisional Certificates (PC).",
            "Compliance & Legal Accountability: Compiling and posting legally compliant Corporate GST Invoices straight to your workspace within 24 hours of successful validation."
          ]
        },
        {
          subTitle: "Data Sharing & Third-Party Protections",
          subPoints: [
            "Strict Third-Party Restrictions: ELITE TOOLISTIC treats proprietary and personal data with high security. We do not sell, rent, trade, or share your personal, documentary, or biometric data with external third-party marketing networks or unrelated data brokers.",
            "Conditional Sharing Framework: Payment Processing: Financial details are managed securely via encrypted, external payment gateways during checkout to clear transactions safely.",
            "Dispute and Chargeback Defense: In alignment with our Terms and Conditions, if a user files a transaction dispute, credit card chargeback, or payment reversal claim, ELITE TOOLISTIC will submit backend server logs (such as download metrics and KYC verification markers) to the involved financial institutions to defend against the claim.",
            "Legal Enforcement: Data may be disclosed if required by an official court order, applicable government statutory body, or prevailing regulatory legal framework."
          ]
        },
        {
          subTitle: "Technical Safeguards & Infrastructure",
          subPoints: [
            "Data Encryption: Document uploads, video files, and financial invoice generation are processed and stored over secure, encrypted network connections.",
            "Workspace Automated Bans: Automated behavioral system parameters track multi-location concurrent logins. Profiles attempting unauthorized concurrent access, scraping attempts via scripts, or distributing video access streams are banned to ensure ecosystem security."
          ]
        },
        {
          subTitle: "Data Retention & Audit Trails",
          subPoints: [
            "Operational Files: Personal profile structures, exam transcripts, and credential verification links are kept for as long as your workspace account remains active or to fulfill tax, corporate accounting, or institutional tracking standards.",
            "KYC Security Profiles: Biometric checks and government identification logs are preserved securely to maintain an unalterable transaction audit trail, serving as definitive evidence of contractual compliance."
          ]
        },
        {
          subTitle: "Dynamic Acknowledgement",
          subPoints: [
            "Interacting with the platform, completing registrations, or inputting identity vectors implies explicit and dynamic acknowledgement of this Privacy Policy. If you do not accept these data handling rules, you must immediately halt data submission and exit the platform."
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
          subTitle: "Notice to All Clients",
          subPoints: [
            "By completing a transaction, clicking 'I Agree', or accessing training workspaces, you explicitly declare that you have read, understood, and agreed to be legally bound by this Service Delivery Framework and No-Refund Policy."
          ]
        },
        {
          subTitle: "01. Scope of Independent Vocational Services",
          subPoints: [
            "By completing a commercial transaction and registering for any training program on ELITE TOOLISTIC (https://www.elitetoolistic.com), the user explicitly acknowledges and agrees that all services rendered are independent, skill-based vocational training programs.",
            "ELITE TOOLISTIC functions strictly as an asynchronous educational infrastructure platform. Our programs are non-degree, non-diploma courses and explicitly do not require or maintain any affiliation, accreditation, or licensing from any university, government institute, or private educational board. ELITE TOOLISTIC grants institutional 'Certificates of Completion' and 'Provisional Certificates' based solely on independent competency assessments."
          ]
        },
        {
          subTitle: "02. Asynchronous Delivery Model & Anti-Interactive Clauses",
          subPoints: [
            "Exclusivity of Medium: Training is delivered solely and exclusively via pre-recorded, asynchronous video lecture modules and downloadable PDF text study workbooks.",
            "Prohibition of Live Training: ELITE TOOLISTIC never offers, promises, or provides any person-to-person instruction, live classroom training, group webinars, real-time mentorship, or interactive tutor sessions.",
            "Self-Directed Operational Responsibility: The Student bears absolute responsibility for navigating the course materials independently within the platform’s self-contained hosting framework. No claims for refunds based on the lack of live human interaction will be entertained under any circumstances, as the platform explicitly disclaims interactive training."
          ]
        },
        {
          subTitle: "03. Strict 9-Step Service Delivery Protocol & Binding Benchmarks",
          subPoints: [
            "Fulfillment of the purchase contract is systematically tracked and verified by our backend architecture across nine sequential milestones: Step 1 (Immediate Admission Confirmation), Step 2 (Mandatory Document KYC), Step 3 (Mandatory Video KYC Authentication), Step 4 (GST Invoice Delivery within 24 Hours), Step 5 (PDF Study Material Dissemination - Strict One-Time Release), Step 6 (Enrollment Certificate Issuance), Step 7 (Video Lecture Access Provisioning - Strict One-Time Release), Step 8 (Final Examination Login Credentials), Step 9 (Final Exam Grading & Provisional Certificate Delivery)."
          ]
        },
        {
          subTitle: "04. Defatigability of Services & Definitive 'No-Refund' Policy",
          subPoints: [
            "ELITE TOOLISTIC distributes high-value, proprietary digital intellectual property. Due to the digital nature of these assets—which can be instantly viewed, saved, or downloaded upon release—all transactions executed on https://www.elitetoolistic.com are strictly FINAL, NON-CANCELLABLE, AND NON-REFUNDABLE.",
            "Instant Fulfillment Waiver: The moment Step 1 (Admission Confirmation) is triggered and Step 5 (PDF Study Material Dissemination) is executed, the platform has fully performed its digital delivery obligations. The Client explicitly waives any right to an operational 'cooling-off period' or transaction cancellation.",
            "The One-Time Sharing Indemnification: The Client agrees that the execution of the 'Strict One-Time Release' protocols for reading materials and video access provides definitive structural proof of service completion. The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules.",
            "KYC Refusal Forfeiture: If a user refuses to complete Step 2 (Document KYC) or Step 3 (Video KYC), or if they deliberately upload false data to bypass identification, the account will be permanently banned for a security breach. In such scenarios, all paid registration fees are entirely forfeited to cover administrative processing costs, and no refund claims will be honored.",
            "Chargeback & Dispute Mitigation: Any attempt by the Client to file an unauthorized transaction dispute, credit card chargeback, or digital payment reversal claim by misrepresenting our 9-step process will be legally treated as a breach of contract. ELITE TOOLISTIC will immediately submit this binding Terms and Conditions policy, along with backend server log data tracking successful file distribution, to the relevant financial institution to aggressively deny the claim."
          ]
        },
        {
          subTitle: "05. Acceptance of Terms",
          subPoints: [
            "By scrolling past this screen, clicking 'I Agree,' or processing a training fee payment on our network domains, you explicitly declare that you have read, understood, and agreed to be legally bound by this Service Delivery Framework and No-Refund Policy. If you do not accept these asynchronous, un-affiliated delivery constraints, you must exit our platform immediately and refrain from purchasing any services."
          ]
        }
      ]
    },
    {
      title: "4. Refund Policy (Service Fulfillment & No-Refund Policy)",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3m1.5 3l3-3m-6.75 3H5.25a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5a2.25 2.25 0 01-2.25 2.25h-3" />
        </svg>
      ),
      color: "bg-rose-500",
      points: [
        {
          subTitle: "Binding Policy Notice",
          subPoints: [
            "Transactions executed on ELITE TOOLISTIC are strictly final, non-cancellable, and non-refundable upon immediate deployment of digital study materials and workspace access keys."
          ]
        },
        {
          subTitle: "01. Executive Summary & Legal Framework of Services",
          subPoints: [
            "ELITE TOOLISTIC functions strictly and exclusively as an independent, asynchronous educational infrastructure platform. The digital training pathways, core methodologies, and instructional material hosted on the platform are structured solely as non-degree, non-diploma vocational training programs aimed at execution-level corporate skill development.",
            "Independent Status Notice: ELITE TOOLISTIC does not maintain, require, or claim any affiliation, accreditation, licensing, or oversight from any university, government institute, statutory educational body, or private educational board. Normal academic withdrawal policies, student tuition protection schemes, or traditional institutional refund metrics are wholly inapplicable to transactions executed with this platform."
          ]
        },
        {
          subTitle: "02. Asynchronous Delivery Model & Anti-Interactive Clauses",
          subPoints: [
            "A fundamental pillar of this refund policy is the nature of the service delivery itself. The commercial valuation of the program is tied directly to the ingestion of proprietary digital intellectual property rather than live human instruction.",
            "Exclusivity of Medium: All vocational training curricula are delivered solely and exclusively via pre-recorded, asynchronous video lecture modules and downloadable PDF text study workbooks.",
            "Prohibition of Live Training: The platform never offers, promises, schedules, or provides any form of person-to-person instruction, live virtual classroom training, synchronous group webinars, real-time mentorship, or interactive tutor-led question-and-answer sessions.",
            "Binding Clause: No claims, complaints, demands, or legal petitions for refunds based on a purported lack of live human interaction, lack of custom feedback, or dissatisfaction with the self-guided nature of the platform will be entertained under any circumstances."
          ]
        },
        {
          subTitle: "03. The Strict 9-Step Service Delivery Protocol",
          subPoints: [
            "Fulfillment of the digital purchase contract is systematically tracked, timestamped, and verified by the platform's automated backend server log database across nine sequential milestones (Step 1 Immediate Admission Confirmation through Step 9 Final Exam Result & Provisional Certificate Delivery). Completion of these milestones constitutes definitive operational execution of the service loop."
          ]
        },
        {
          subTitle: "04. Defatigability of Services & Definitive 'No-Refund' Core Policy",
          subPoints: [
            "ELITE TOOLISTIC distributes high-value, proprietary digital intellectual property. Due to the digital nature of these assets—which can be instantly viewed, saved, cached, screenshotted, or downloaded immediately upon release—all transactions executed on https://www.elitetoolistic.com are strictly FINAL, NON-CANCELLABLE, AND NON-REFUNDABLE.",
            "Instant Fulfillment Waiver: Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). The Client explicitly waives any right to an operational 'cooling-off period' or transaction cancellation once assets are deployed.",
            "One-Time Sharing Indemnification: The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules.",
            "KYC Refusal Forfeiture: Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs.",
            "Dispute & Chargeback Mitigation: Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim."
          ]
        },
        {
          subTitle: "05. Exhaustive Legal Provisos & Operational Enforcement",
          subPoints: [
            "Technical Incompatibility & Device Disclaimers: It is the sole technical responsibility of the Client to ensure hardware, OS, and internet service providers meet baseline operational requirements. No refunds will be granted based on technical limitations, outdated browsers, firewalls, network latency, ISP restrictions, or device incompatibility.",
            "Unilateral Account Revocation for Security Violations: Immediate termination without refund for concurrent multi-location IP logins indicating profile sharing, attempted injection of data-scraping scripts or stream-ripping software, or uploading corrupted packages, malware, or fraudulent identity documentation.",
            "Program Modification & Discontinuance Indemnity: Platform reserves the right to modify, adjust, update, or re-sequence instructional modules, workbooks, grading metrics, or exam platforms at any time. Updates do not entitle the Client to a retrofitted refund, platform credit, or course exchange."
          ]
        },
        {
          subTitle: "06. Acceptance of Terms & Dynamic Acknowledgement",
          subPoints: [
            "By scrolling past presentation screens, checking an 'I Agree' checkbox, interacting with any workspace element, or processing a training fee payment, you explicitly declare that you have read, understood, and agreed to be legally bound by this Service Delivery Framework and No-Refund Policy."
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
                          <div className="grid grid-cols-1 gap-2.5">
                            {point.subPoints.map((sub, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-2.5 text-[12px] text-slate-600 font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-100/60 leading-relaxed">
                                <svg className="text-primary-500 shrink-0 mt-0.5" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{sub}</span>
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
                    "Definitive No-Refund Policy (Digital Assets)",
                    "Mandatory Document & Video KYC",
                    "Strict One-Time Release (Materials & Videos)",
                    "Asynchronous & Non-Interactive Delivery",
                    "Systematic 9-Step Service Delivery Architecture"
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
