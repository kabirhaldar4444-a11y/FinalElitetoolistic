import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { useToast } from '../common/AlertProvider';

const SubmissionCard = ({ sub, viewDetails, handleToggleRelease, fetchSubmissions, toast, isReadOnly }) => {
  const maxScore = sub.total_questions * 5;
  const currentSavedScore = sub.admin_score_override ?? sub.score;
  
  // Single source of truth for the local UI
  const [localScore, setLocalScore] = useState(currentSavedScore);
  const [isSyncing, setIsSyncing] = useState(false);

  // Safely sync with upstream data ONLY if the input is not currently dirty
  useEffect(() => {
    setLocalScore(prev => {
      const currentParsed = parseInt(prev);
      const isCurrentlyDirty = (prev === '') || (!isNaN(currentParsed) && currentParsed !== currentSavedScore);
      // Strictly prevent overwriting actively typed input if a background fetch completes
      return isCurrentlyDirty ? prev : (sub.admin_score_override ?? sub.score);
    });
  }, [sub.admin_score_override, sub.score, currentSavedScore]);

  const hasOverride = sub.admin_score_override !== null && sub.admin_score_override !== sub.score;
  const currentParsed = parseInt(localScore);
  // Show save options if currently editing, including if they temporarily deleted the number
  const isDirty = (localScore === '') || (!isNaN(currentParsed) && currentParsed !== currentSavedScore);

  const saveScoreToDB = async () => {
    if (isReadOnly) return;
    let validScore = parseInt(localScore);
    // Keep last valid value if input completely breaks or is empty
    if (isNaN(validScore)) validScore = currentSavedScore;
    
    // Strictly enforce limits before saving
    if (validScore < 0) validScore = 0;
    if (validScore > maxScore) validScore = maxScore;

    setIsSyncing(true);
    const { error } = await supabase
      .from('submissions')
      .update({ admin_score_override: validScore })
      .eq('id', sub.id);
      
    if (error) {
      toast(error.message, 'error');
      setLocalScore(currentSavedScore); // Revert safely on failure
    } else {
      setLocalScore(validScore); // Lock in the valid state
      await fetchSubmissions(); 
      toast('Marks explicitly saved and updated successfully', 'success');
    }
    
    setIsSyncing(false);
  };

  const resetToSystemDefault = async () => {
    if (isReadOnly) return;
    setIsSyncing(true);
    const { error } = await supabase
      .from('submissions')
      .update({ admin_score_override: null })
      .eq('id', sub.id);
    if (!error) {
       await fetchSubmissions();
       toast('Score reverted to original automatic calculation', 'success');
    } else {
       toast(error.message, 'error');
    }
    setIsSyncing(false);
  };

  const handleIncrement = () => {
    setLocalScore(prev => {
      const val = parseInt(prev) || 0;
      if (val >= maxScore) return maxScore;
      return val + 1;
    });
  };

  const handleDecrement = () => {
    setLocalScore(prev => {
      const val = parseInt(prev) || 0;
      if (val <= 0) return 0;
      return val - 1;
    });
  };
  
  const handleInputChange = (e) => {
    // Strictly prevent non-numeric entry (prevents "e", "-", etc.)
    const strictVal = e.target.value.replace(/[^0-9]/g, '');
    setLocalScore(strictVal);
  };

  const handleInputBlur = () => {
    // Gracefully handle empty or invalid state if user clicks away without saving
    let validScore = parseInt(localScore);
    if (isNaN(validScore)) validScore = currentSavedScore; // Restores visually instantly
    if (validScore < 0) validScore = 0;
    if (validScore > maxScore) validScore = maxScore;
    setLocalScore(validScore);
  };

  const isAtMin = (parseInt(localScore) || 0) <= 0;
  const isAtMax = (parseInt(localScore) || 0) >= maxScore;

  return (
    <div className="relative glass-card-saas p-6 border group transition-all duration-500 hover:shadow-lg" style={{ borderColor: 'var(--glass-border)', backgroundColor: isDirty ? 'var(--input-bg)' : 'transparent' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 shadow-inner group-hover:scale-110 transition-transform">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="text-xl font-black text-[color:var(--text-dark)] tracking-tight m-0 leading-none">{sub.exams?.title}</h4>
            {hasOverride && (
              <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">Modified</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-[color:var(--text-light)] ml-[52px]">
            <span className="flex items-center gap-1.5 opacity-80 pb-0.5">
              Marks: <span className="font-black text-[color:var(--text-dark)]">{sub.score}</span>
            </span>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-6 ml-[52px] md:ml-0">
            
            {/* Smart Marks UI Editor */}
            <div className="flex flex-col relative w-[160px]">
              <div className="flex justify-between items-end mb-1.5 px-1 opacity-80 h-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 drop-shadow-sm">Final Marks</span>
                {hasOverride && !isDirty && (
                  <button 
                    onClick={resetToSystemDefault}
                    disabled={isSyncing}
                    title="Undo changes and revert to system calculated score"
                    className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 active:scale-95 transition-all outline-none"
                  >
                    Restore Default
                  </button>
                )}
              </div>
              
              <div className={`flex items-center bg-[color:var(--card-bg)] border rounded-[1.25rem] p-1.5 transition-all duration-300 ${isDirty ? 'border-amber-500 ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/10' : 'border-[color:var(--glass-border)] hover:border-primary-500/50 shadow-sm hover:shadow-md'}`}>
                <button 
                  type="button" 
                  onClick={handleDecrement} 
                  disabled={isAtMin || isSyncing}
                  title="Decrease Marks (-1)"
                  className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-[color:var(--input-bg)] hover:bg-rose-500 hover:text-white text-[color:var(--text-dark)] transition-all active:scale-90 disabled:opacity-30 disabled:hover:bg-[color:var(--input-bg)] disabled:hover:text-[color:var(--text-dark)] disabled:cursor-not-allowed group/btn"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover/btn:-translate-x-0.5" stroke="currentColor" strokeWidth="2.5"><path d="M20 12H4" strokeLinecap="round"/></svg>
                </button>
                
                <div className="relative flex items-center justify-center flex-1 group/input overflow-hidden z-10 bg-transparent">
                  <style>{`input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
                  <input 
                    type="number"
                    value={localScore}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    min="0"
                    max={maxScore}
                    title="Directly type marks"
                    disabled={isSyncing}
                    className="w-full text-center font-black text-2xl text-[color:var(--text-dark)] bg-transparent border-none outline-none m-0 p-0 transition-colors focus:text-amber-500"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
                
                <button 
                  type="button" 
                  onClick={handleIncrement} 
                  disabled={isAtMax || isSyncing}
                  title="Increase Marks (+1)"
                  className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-[color:var(--input-bg)] hover:bg-emerald-500 hover:text-white text-[color:var(--text-dark)] transition-all active:scale-90 disabled:opacity-30 disabled:hover:bg-[color:var(--input-bg)] disabled:hover:text-[color:var(--text-dark)] disabled:cursor-not-allowed group/btn"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover/btn:translate-x-0.5" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" strokeLinecap="round"/></svg>
                </button>
              </div>

              {/* Smart Save Dropdown */}
              <div className={`overflow-hidden transition-all duration-300 w-full flex absolute top-full left-0 z-20 ${isDirty ? 'max-h-12 opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={saveScoreToDB} 
                    disabled={isSyncing} 
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2 text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1 disabled:opacity-50 disabled:scale-100"
                  >
                    {isSyncing ? <div className="w-4 h-4 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    SAVE
                  </button>
                  <button 
                    onClick={() => setLocalScore(currentSavedScore)} 
                    disabled={isSyncing} 
                    className="flex-1 bg-[color:var(--input-bg)] border border-[color:var(--input-border)] hover:bg-black/5 text-[color:var(--text-dark)] rounded-xl py-2 text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1 disabled:opacity-50"
                    title="Discard changes"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    CANCEL
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-dashed pl-0 md:pl-6" style={{ borderColor: 'var(--glass-border)' }}>
              <button 
                onClick={() => viewDetails(sub)}
                className="flex items-center gap-2 justify-center px-5 py-2.5 rounded-xl border-2 border-primary-500/20 text-primary-500 hover:bg-primary-500/10 font-bold transition-colors text-sm shadow-sm"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Question Breakdowns
              </button>
              <button 
                onClick={() => handleToggleRelease(sub.id, sub.is_released)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-white ${sub.is_released ? 'bg-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/40' : 'bg-gradient-to-r from-primary-600 to-indigo-600 shadow-primary-500/20 hover:shadow-primary-500/40'}`}
              >
                {sub.is_released ? (
                  <><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Result Live</>
                ) : (
                  <><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg> Publish Score</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserSubmissions = ({ userId, isReadOnly }) => {
  const toast = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [userId]);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, exams(title)')
      .eq('user_id', userId);
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const handleToggleRelease = async (id, currentStatus) => {
    const { error } = await supabase
      .from('submissions')
      .update({ is_released: !currentStatus })
      .eq('id', id);
    if (!error) fetchSubmissions();
    else toast(error.message, 'error');
  };

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionQuestions, setSubmissionQuestions] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const viewDetails = async (sub) => {
    setSelectedSubmission(sub);
    setDetailsLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', sub.exam_id)
      .order('created_at', { ascending: true });
    
    if (data) setSubmissionQuestions(data);
    setDetailsLoading(false);
  };

  if (loading) return <p>Loading submissions...</p>;
  if (submissions.length === 0) return <p style={{ color: 'var(--text-light)' }}>No assessments completed yet.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {submissions.map(sub => (
        <SubmissionCard
          key={sub.id}
          sub={sub}
          viewDetails={viewDetails}
          handleToggleRelease={handleToggleRelease}
          fetchSubmissions={fetchSubmissions}
          toast={toast}
          isReadOnly={isReadOnly}
        />
      ))}

      {/* Analysis Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[color:var(--premium-bg)] w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl border" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="p-6 border-b flex justify-between items-center bg-[color:var(--card-bg)]" style={{ borderColor: 'var(--glass-border)' }}>
              <div>
                <h3 className="text-xl font-black text-[color:var(--text-dark)]">{selectedSubmission.exams?.title} - Analysis</h3>
                <p className="text-sm text-[color:var(--text-light)]">Candidate Score: {selectedSubmission.score} / {selectedSubmission.total_questions * 5}</p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[color:var(--premium-bg)]">
              {detailsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold text-primary-500">Loading Question Breakdown...</p>
                </div>
              ) : (
                submissionQuestions.map((q, idx) => {
                  const userAnswerIdx = selectedSubmission.answers[idx];
                  const isCorrect = userAnswerIdx === q.correct_option;
                  
                  return (
                    <div key={q.id} className="p-6 rounded-2xl border bg-[color:var(--card-bg)]" style={{ borderColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.1)' }}>
                      <div className="flex items-start gap-4 mb-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm ${isCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-lg font-bold text-[color:var(--text-dark)] mb-4">{q.question_text}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => {
                              const isCorrectOption = optIdx === q.correct_option;
                              const isUserAnswer = optIdx === userAnswerIdx;
                              
                              let borderClass = 'border-transparent';
                              let bgClass = 'bg-[color:var(--input-bg)]';
                              let icon = null;

                              if (isCorrectOption) {
                                borderClass = 'border-emerald-500/50';
                                bgClass = 'bg-emerald-500/10';
                                icon = <svg className="text-emerald-500" width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>;
                              } else if (isUserAnswer && !isCorrect) {
                                borderClass = 'border-rose-500/50';
                                bgClass = 'bg-rose-500/10';
                                icon = <svg className="text-rose-500" width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>;
                              }

                              return (
                                <div key={optIdx} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${borderClass} ${bgClass}`}>
                                  <span className="text-sm font-medium text-[color:var(--text-dark)]">{opt}</span>
                                  {icon}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-sm">
                              <span className="font-black text-blue-500 uppercase tracking-widest text-[9px] block mb-1">Explanation</span>
                              <p className="text-[color:var(--text-light)] italic leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-6 border-t bg-[color:var(--card-bg)]" style={{ borderColor: 'var(--glass-border)' }}>
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="w-full btn-premium !py-3"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubmissions;
