import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { useToast } from '../common/AlertProvider';

const ExamPortal = ({ exam, onFinish, submitSignal }) => {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReEntry, setIsReEntry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [hasAcceptedDeclaration, setHasAcceptedDeclaration] = useState(false);
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);
  const [visitedIndices, setVisitedIndices] = useState(new Set([0]));
  const [reviewedIndices, setReviewedIndices] = useState(new Set());

  const answersRef = React.useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
    // Save answers and index to localStorage
    if (exam?.id) {
      localStorage.setItem(`exam_progress_${exam.id}`, JSON.stringify({
        answers,
        currentQuestionIndex,
        timeLeft
      }));
    }
  }, [answers, currentQuestionIndex, timeLeft, exam.id]);

  const [confirmedSignal, setConfirmedSignal] = useState(0);

  useEffect(() => {
    if (submitSignal > 0 && submitSignal !== confirmedSignal && !isSubmitted) {
      setShowConfirm(true);
      setConfirmedSignal(submitSignal);
    }
  }, [submitSignal]);

  useEffect(() => {
    // Load persisted state on mount
    const savedProgress = localStorage.getItem(`exam_progress_${exam.id}`);
    if (savedProgress) {
      const { answers: savedAnswers, currentQuestionIndex: savedIndex, timeLeft: savedTime } = JSON.parse(savedProgress);
      if (savedAnswers) setAnswers(savedAnswers);
      if (savedIndex !== undefined) setCurrentQuestionIndex(savedIndex);
      if (savedTime !== undefined) setTimeLeft(savedTime);
    }
    fetchQuestions();
  }, [exam.id]);

  const fetchQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Check if already submitted (Corrected column name: user_id)
      const { data: existingSub } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('exam_id', exam.id)
        .single();
      
      if (existingSub) {
        setIsSubmitted(true);
        setIsReEntry(true);
        setLoading(false);
        return;
      }

      // 2. Fetch questions if not submitted
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id);
      
      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        // Fallback for empty exams
        setQuestions([{ 
          id: 'mock-1', 
          question_text: "What is 2+2?", 
          options: ["3", "4", "5", "6"], 
          correct_option: 1 
        }]);
      }
    } catch (err) {
      console.error('Error in ExamPortal init:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitted) {
      // Time is up! Automatic submission
      setTimeExpired(true);
      setShowConfirm(true);
      // Wait 3 seconds so the user can actually see the "Time's Up" modal before auto-submitting
      const autoSubmitTimer = setTimeout(() => {
        if (!isSubmitted) {
          setShowConfirm(false);
          handleSubmitWithAnswers(answersRef.current);
        }
      }, 3000);
      return () => clearTimeout(autoSubmitTimer);
    }
    if (isSubmitted || !hasAcceptedDeclaration) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, hasAcceptedDeclaration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOptionSelect = (optionIdx) => {
    setAnswers({ ...answers, [currentQuestionIndex]: optionIdx });
    // If it was reviewed, maybe keep it reviewed? Usually answering removes from "not answered" but "reviewed" is a separate flag.
  };

  const toggleReview = () => {
    const newReviewed = new Set(reviewedIndices);
    if (newReviewed.has(currentQuestionIndex)) {
      newReviewed.delete(currentQuestionIndex);
    } else {
      newReviewed.add(currentQuestionIndex);
    }
    setReviewedIndices(newReviewed);
  };

  const jumpToQuestion = (idx) => {
    setCurrentQuestionIndex(idx);
    setVisitedIndices(prev => new Set([...prev, idx]));
  };

  const handleSubmitWithAnswers = async (currentAnswers) => {
    if (isSubmitted) return;
    
    // calculate score uses answers state, we need local calculation
    let score = 0;
    questions.forEach((q, idx) => {
      if (currentAnswers[idx] === q.correct_option) score += 5;
    });

    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    
    if (user) {
      const { error } = await supabase.from('submissions').insert([{
        user_id: user.id,
        exam_id: exam.id,
        score: score,
        total_questions: questions.length,
        answers: currentAnswers,
        is_released: false
      }]);

      if (error) {
        toast('Error saving submission: ' + error.message, 'error');
        return;
      }
    }

    setIsSubmitted(true);
    localStorage.removeItem(`exam_progress_${exam.id}`);
    toast('Your exam has been submitted successfully!', 'success');
  };

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const confirmAndSubmit = () => {
    setShowConfirm(false);
    handleSubmitWithAnswers(answersRef.current);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct_option) {
        score += 5;
      }
    });
    return score;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!hasAcceptedDeclaration) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 md:p-12 animate-fade-in relative z-10 w-full overflow-y-auto font-sans">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary-100/30 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-100/30 rounded-full blur-[128px] pointer-events-none" />

        <div className="relative w-full max-w-4xl bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] border border-slate-200 z-10 p-8 md:p-12 animate-slide-up">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-100 pb-10">
            <div className="flex items-center gap-6">
              <button 
                onClick={onFinish}
                className="group flex items-center gap-2 text-slate-400 hover:text-[--primary-color] transition-colors font-bold text-sm"
              >
                <svg className="transform group-hover:-translate-x-1 transition-transform" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 shadow-sm border border-primary-100">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.35a1 1 0 011.3 0l6.75 6.75a1 1 0 010 1.41l-6.75 6.75a1 1 0 01-1.3 0l-6.75-6.75a1 1 0 010-1.41l6.75-6.75z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">{exam.title}</h1>
                <p className="text-xs font-black text-primary-600 tracking-[0.2em] uppercase mt-2">Elite Assessment Entrance</p>
              </div>
            </div>
            
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <div className="px-5 py-2 text-center border-r border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Duration</p>
                <p className="text-sm font-black text-slate-900">{exam.duration || 0} Minutes</p>
              </div>
              <div className="px-5 py-2 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Total Load</p>
                <p className="text-sm font-black text-slate-900">{questions.length} Questions</p>
              </div>
            </div>
          </div>

          {/* Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full"></span>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">General Instructions</h3>
              </div>
              <div className="space-y-4 text-slate-600 font-medium">
                {[
                  "Ensure a stable internet connection for the entire duration.",
                  `System will automatically submit if the ${exam.duration || 0}-minute timer runs out.`,
                  "Unauthorized tab switching or browser minimized is strictly logged.",
                  "Do not refresh the page once the exam has started."
                ].map((text, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-primary-500 font-black">•</span>
                    <p className="text-[15px] leading-relaxed italic">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Marking Scheme</h3>
              </div>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-black uppercase text-slate-500">Correct Attempt</span>
                  <span className="text-sm font-black text-emerald-600">+5 Marks</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50 shadow-sm group">
                  <span className="text-xs font-black uppercase text-emerald-800">Negative Marking</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-widest uppercase">No Penalty</span>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 italic">
                <span className="text-amber-500">⚠️</span>
                <p className="text-[13px] font-bold text-amber-700 leading-tight">Proctoring is active. Any suspicious activity will lead to immediate disqualification.</p>
              </div>
            </section>
          </div>

          {/* Candidate Oath & Acceptance */}
          <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-inner">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">Integrity Declaration</h4>
                <p className="text-[15px] font-bold text-slate-600 leading-relaxed italic">
                  "I solemnly declare that I have read and understood all instructions. I will complete this assessment independently and follow the highest standards of academic integrity during the session."
                </p>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="flex flex-col items-center gap-8">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={acceptedCheckbox}
                      onChange={(e) => setAcceptedCheckbox(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-7 h-7 rounded-xl border-2 border-slate-300 bg-white transition-all peer-checked:bg-primary-600 peer-checked:border-primary-600 group-hover:border-primary-400 flex items-center justify-center">
                      <svg className={`w-4 h-4 text-white transition-transform duration-300 ${acceptedCheckbox ? 'scale-100' : 'scale-0'}`} fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-700 tracking-tight group-hover:text-primary-600 transition-colors">
                    I acknowledge and agree to the instructions above
                  </span>
                </label>

                {/* Conditional Start Button with smooth entrance */}
                <div className={`w-full transition-all duration-700 transform ${acceptedCheckbox ? 'opacity-100 translate-y-0 scale-100 h-auto visible' : 'opacity-0 translate-y-8 scale-95 h-0 overflow-hidden invisible'}`}>
                  <button
                    onClick={() => setHasAcceptedDeclaration(true)}
                    className="w-full py-6 rounded-[2rem] font-black tracking-[0.25em] flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-primary-500/30 hover:shadow-primary-600/50 hover:scale-[1.01] active:scale-95 uppercase text-sm"
                  >
                    Start Examination Now
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </button>
                  <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.2em] mt-4 ml-1">The timer will initiate immediately</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Confirm Submit Modal ── */
  const ConfirmModal = () => (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
      {/* Card */}
      <div className="relative glass-card-saas p-8 max-w-md w-full animate-slide-up border-t-4 border-t-amber-500 shadow-2xl text-center z-10">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center ring-8 ring-amber-500/5">
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
        </div>
        <h3 className="text-2xl font-black mb-3 text-[color:var(--text-dark)]">Submit Exam?</h3>
        <p className="text-[color:var(--text-light)] text-sm leading-relaxed mb-2">
          You have answered <span className="font-bold text-primary-500">{Object.keys(answers).length}</span> out of <span className="font-bold">{questions.length}</span> questions.
        </p>
        <p className="text-[color:var(--text-light)] text-sm mb-8">
          Once submitted, <span className="text-amber-500 font-bold">you cannot make any changes.</span>
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-3 px-6 rounded-xl font-bold border transition-all hover:bg-white/5 text-[color:var(--text-light)]"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            No, Continue
          </button>
          <button
            onClick={confirmAndSubmit}
            className="flex-1 py-3 px-6 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95"
          >
            Yes, Submit
          </button>
        </div>
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-6 animate-fade-in relative z-10 w-full">
        {/* Animated Background Ambience */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none"></div>
        
        <div className="glass-card-saas p-10 md:p-14 text-center max-w-xl w-full relative z-10 animate-slide-up border-t-4 border-t-emerald-500">
          <div className="w-24 h-24 mx-auto bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-inner ring-8 ring-emerald-500/5">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-4 text-[color:var(--text-dark)]">Exam Submitted!</h2>
          <p className="text-[color:var(--text-light)] text-base font-medium leading-relaxed mb-8">
            Your responses have been successfully recorded.<br/>
            <span className="text-primary-500 font-bold mt-2 inline-block">Results are currently locked</span> and will be available on your dashboard once approved.
          </p>
          
          {!isReEntry && (
            <div className="mb-8 p-5 rounded-2xl flex flex-col items-center gap-2 border bg-blue-500/5 border-blue-500/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">Time Taken</span>
              <span className="text-xl font-black text-blue-500/90">{formatTime(exam.duration * 60 - timeLeft)}</span>
            </div>
          )}
          
          <button onClick={onFinish} className="btn-premium w-full py-4 font-black tracking-wide flex items-center justify-center gap-2 hover:scale-[1.02] shadow-xl shadow-primary-500/20">
            Return to Dashboard
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      {/* Confirm Submit Modal Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative glass-card-saas p-8 max-w-md w-full animate-slide-up border-t-4 shadow-2xl text-center z-10" style={{ borderTopColor: timeExpired ? '#f59e0b' : '#10b981' }}>
            <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ring-8 ${timeExpired ? 'bg-amber-500/10 text-amber-500 ring-amber-500/5' : 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/5'}`}>
              {timeExpired ? (
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              )}
            </div>
            <h3 className="text-2xl font-black mb-3 text-[color:var(--text-dark)]">
              {timeExpired ? "⏱️ Time's Up!" : 'Submit Exam?'}
            </h3>
            <p className="text-[color:var(--text-light)] text-sm leading-relaxed mb-2">
              {timeExpired 
                ? 'Your exam time has ended. Your answers will be submitted now.'
                : <>You have answered <span className="font-bold text-primary-500">{Object.keys(answers).length}</span> out of <span className="font-bold">{questions.length}</span> questions.</>
              }
            </p>
            <p className="text-[color:var(--text-light)] text-sm mb-8">
              Once submitted, <span className="text-amber-500 font-bold">you cannot make any changes.</span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-6 rounded-xl font-bold border border-slate-200 transition-all hover:bg-slate-50 text-slate-500"
              >
                No, Continue
              </button>
              <button
                onClick={confirmAndSubmit}
                className="flex-1 py-3 px-6 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="exam-portal w-full h-screen max-h-screen bg-[#f8fafc] animate-fade-in relative z-10 p-2 md:p-3 overflow-hidden flex flex-col font-sans">
        {/* Modern Ambient Backdrop */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Definitive Global Command Bar */}
        {/* Floating Global Command Bar */}
        <div className="max-w-[1440px] mx-auto w-full mb-3 md:mb-4 shrink-0 relative z-20">
          <div className="bg-white/60 backdrop-blur-xl px-4 md:px-6 py-2 rounded-3xl shadow-[0_4px_30px_rgba(79,70,229,0.08)] border border-white/40 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                  <img src="/logo_full.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-0.5">Live Examination</span>
                  <h2 className="text-xl font-[900] tracking-tighter text-slate-900 leading-none">{exam.title}</h2>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="flex items-center gap-6 bg-slate-50 px-6 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex-1 md:flex-none">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Time Remaining</span>
                  <div className={`text-xl font-black tabular-nums flex items-center gap-2.5 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-800'}`}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>
              <button onClick={handleSubmit} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-[9px] flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.03] active:scale-95 group uppercase tracking-widest">
                Submit Exam
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="transition-transform group-hover:translate-x-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 max-w-[1440px] mx-auto w-full flex-1 overflow-hidden pb-3 relative z-20">
          <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden">
            <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] p-4 md:p-6 flex flex-col h-full shadow-[0_15px_40px_rgba(79,70,229,0.05)] border border-white/40 relative transition-all duration-300 overflow-hidden">
              <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0 gap-4 md:gap-8">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-slate-900 text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                    <span className="text-base font-black">{currentQuestionIndex + 1}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-none mb-1">Assessment Flow</span>
                    <span className="text-xs font-bold text-slate-500">Step {currentQuestionIndex + 1} of {questions.length}</span>
                  </div>
                </div>
                <div className="hidden md:flex flex-1 items-center gap-4 max-w-xl">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-50/50 p-0 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.2)]" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] shrink-0">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 md:pr-4 custom-scrollbar animate-slide-up min-h-0" key={currentQuestionIndex}>
                <div className="flex gap-3 md:gap-4 items-start mb-4 md:mb-6">
                  <div className="w-1 h-8 md:h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)] shrink-0 mt-0.5"></div>
                  <h3 className="text-lg md:text-xl font-[800] leading-tight text-slate-800 break-words tracking-tight">{currentQuestion.question_text}</h3>
                </div>
                <div className="grid grid-cols-1 gap-2 md:gap-2.5 max-w-3xl ml-0 md:ml-6">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = answers[currentQuestionIndex] === idx;
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <label key={idx} className={`relative p-2.5 md:p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-3 group ${isSelected ? 'border-indigo-500 bg-indigo-50/40 shadow-sm' : 'hover:border-indigo-200 hover:bg-white border-slate-50 bg-slate-50/30'}`}>
                        <input type="radio" name="option" value={idx} checked={isSelected} onChange={() => handleOptionSelect(idx)} className="sr-only" />
                        <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all font-black text-[10px] shadow-sm ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-400 bg-white'}`}>{letter}</div>
                        <span className={`text-[12px] md:text-sm font-bold transition-colors break-words ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>{option}</span>
                        {isSelected && (
                          <div className="ml-auto w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-50 flex flex-row justify-between items-center gap-3 shrink-0">
                <button onClick={toggleReview} className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-[9px] tracking-widest uppercase transition-all shadow-sm border ${reviewedIndices.has(currentQuestionIndex) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-600 hover:bg-slate-50'}`}>
                  <svg width="14" height="14" fill={reviewedIndices.has(currentQuestionIndex) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                  Review
                </button>
                <div className="flex gap-2">
                  {currentQuestionIndex > 0 && (
                    <button onClick={() => jumpToQuestion(currentQuestionIndex - 1)} className="px-4 py-2 rounded-full font-black text-[9px] tracking-widest uppercase text-slate-500 bg-white border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                  )}
                  <button onClick={() => currentQuestionIndex === questions.length - 1 ? handleSubmit() : jumpToQuestion(currentQuestionIndex + 1)} className="px-6 py-2 font-black tracking-widest text-[9px] flex items-center gap-2 rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-95 bg-slate-900 text-white shadow-lg uppercase">
                    {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-[280px] shrink-0 animate-slide-up h-full min-h-0" style={{ animationDelay: '100ms' }}>
            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-4 md:p-5 flex flex-col h-full shadow-[0_15px_40px_rgba(79,70,229,0.05)] border border-white/40 overflow-hidden">
              <div className="flex items-center gap-3 mb-6 md:mb-8 pb-4 border-b border-slate-50 shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="text-indigo-600"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                <h4 className="text-[11px] font-black tracking-[0.25em] uppercase text-slate-500">Navigation Map</h4>
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-6 md:mb-8 overflow-y-auto flex-1 pr-2 custom-scrollbar min-h-0">
                {questions.map((_, idx) => {
                  const isCurrent = currentQuestionIndex === idx;
                  const isAnswered = answers[idx] !== undefined;
                  const isVisited = visitedIndices.has(idx);
                  const isReviewed = reviewedIndices.has(idx);
                  let status = 'not-visited';
                  if (isReviewed) status = 'reviewed';
                  else if (isAnswered) status = 'answered';
                  else if (isVisited) status = 'not-answered';
                  const renderShape = () => {
                    const baseClasses = "w-9 h-9 flex items-center justify-center font-bold text-[11px] transition-all duration-300 cursor-pointer relative shadow-sm";
                    const activeRing = isCurrent ? "ring-2 ring-indigo-600 ring-offset-2 scale-110 z-10 shadow-lg shadow-indigo-100" : "";
                    if (status === 'reviewed') return <div className={`${baseClasses} ${activeRing} bg-purple-500 text-white rounded-full shape-circle`}>{idx + 1}</div>;
                    if (status === 'answered') return <div className={`${baseClasses} ${activeRing} bg-emerald-500 text-white shape-pentagon`}>{idx + 1}</div>;
                    if (status === 'not-answered') return <div className={`${baseClasses} ${activeRing} bg-orange-500 text-white shape-hexagon`}>{idx + 1}</div>;
                    return <div className={`${baseClasses} ${activeRing} border-2 border-slate-100 text-slate-300 bg-slate-50 hover:border-slate-300 shape-square`}>{idx + 1}</div>;
                  };
                  return <div key={idx} onClick={() => jumpToQuestion(idx)} className="flex justify-center">{renderShape()}</div>;
                })}
              </div>
              <div className="mt-auto pt-4 md:pt-5 border-t border-slate-50 space-y-2 shrink-0">
                {[
                  { shape: 'shape-square bg-slate-50 border border-slate-100', label: 'Not Visited', count: questions.length - visitedIndices.size },
                  { shape: 'shape-hexagon bg-orange-500', label: 'Not Answered', count: visitedIndices.size - Object.keys(answers).length - (new Set([...reviewedIndices].filter(x => !answers[x]))).size },
                  { shape: 'shape-pentagon bg-emerald-500', label: 'Answered', count: Object.keys(answers).length },
                  { shape: 'shape-circle bg-purple-500', label: 'Review', count: reviewedIndices.size }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 shadow-sm ${item.shape}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-black tabular-nums text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExamPortal;

