import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import * as XLSX from 'xlsx';
import { useToast, useConfirm } from '../common/AlertProvider';

const ManageQuestions = ({ exam, onBack }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_option: 0,
    explanation: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [exam.id]);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', exam.id)
      .order('created_at', { ascending: true });
    
    if (data) setQuestions(data);
    setLoading(false);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.question_text || newQuestion.options.some(opt => !opt)) {
      toast('Please fill all fields', 'warning');
      return;
    }

    const { error } = await supabase
      .from('questions')
      .insert([{
        exam_id: exam.id,
        question_text: newQuestion.question_text,
        options: newQuestion.options,
        correct_option: parseInt(newQuestion.correct_option),
        explanation: newQuestion.explanation
      }]);

    if (!error) {
      setNewQuestion({
        question_text: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: ''
      });
      fetchQuestions();
    } else {
      toast('Error adding question: ' + error.message, 'error');
    }
  };

  const handleDeleteQuestion = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This cannot be undone.',
      type: 'error',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (!error) fetchQuestions();
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) throw new Error('Excel file is empty or missing data rows');

        const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
        const rows = jsonData.slice(1);

        // 1. Intelligent Column Mapping
        const findColumn = (keywords) => {
          return headers.findIndex(h => keywords.some(k => h.includes(k)));
        };

        const colIdx = {
          question: findColumn(['question', 'ques', 'text']),
          options: [
            findColumn(['opt1', 'option a', ' a', 'opt_1']),
            findColumn(['opt2', 'option b', ' b', 'opt_2']),
            findColumn(['opt3', 'option c', ' c', 'opt_3']),
            findColumn(['opt4', 'option d', ' d', 'opt_4'])
          ],
          answer: findColumn(['correct', 'answer', 'ans', 'right']),
          explanation: findColumn(['explanation', 'description', 'desc', 'solution', 'sol'])
        };

        // Fallback for options if direct keywords fail (Case 2: a, b, c, d columns)
        if (colIdx.options.some(idx => idx === -1)) {
          colIdx.options = [
            headers.findIndex(h => h === 'a' || h === '1'),
            headers.findIndex(h => h === 'b' || h === '2'),
            headers.findIndex(h => h === 'c' || h === '3'),
            headers.findIndex(h => h === 'd' || h === '4')
          ];
        }

        let successCount = 0;
        let skipCount = 0;

        const questionsToInsert = rows.map((row, rIdx) => {
          const rawQuestion = row[colIdx.question];
          const rawOptions = colIdx.options.map(idx => row[idx]);
          const rawAnswer = row[colIdx.answer];
          const rawExp = colIdx.explanation !== -1 ? row[colIdx.explanation] : '';

          // Data Cleaning & Validation
          const questionText = String(rawQuestion || '').trim();
          const options = rawOptions.map(opt => String(opt || '').trim());
          const explanation = String(rawExp || '').trim();

          if (!questionText || options.filter(o => o).length < 2) {
            skipCount++;
            return null;
          }

          // 2. Multi-Case Correct Answer Detection
          let correctIdx = 0;
          if (rawAnswer !== undefined && rawAnswer !== null) {
            const cleanAns = String(rawAnswer).trim();
            const upperAns = cleanAns.toUpperCase();

            // Case A & E: Letters (A/B/C/D) or Numeric (1/2/3/4)
            if (upperAns === 'A' || upperAns === '1') correctIdx = 0;
            else if (upperAns === 'B' || upperAns === '2') correctIdx = 1;
            else if (upperAns === 'C' || upperAns === '3') correctIdx = 2;
            else if (upperAns === 'D' || upperAns === '4') correctIdx = 3;
            else {
              // Case C: Prefixed Format ("A. Answer")
              const prefixMatch = cleanAns.match(/^([A-D])[.\)]/i);
              if (prefixMatch) {
                const letter = prefixMatch[1].toUpperCase();
                correctIdx = ['A', 'B', 'C', 'D'].indexOf(letter);
              } else {
                // Case B: Full Text Match (Case-Insensitive)
                const matchIdx = options.findIndex(opt => 
                  opt.toLowerCase() === cleanAns.toLowerCase()
                );
                
                if (matchIdx !== -1) {
                  correctIdx = matchIdx;
                } else {
                  // Fallback: Check if Answer string is contained within an option or vice versa
                  const softMatchIdx = options.findIndex(opt => 
                    opt.toLowerCase().includes(cleanAns.toLowerCase()) || 
                    cleanAns.toLowerCase().includes(opt.toLowerCase())
                  );
                  correctIdx = softMatchIdx !== -1 ? softMatchIdx : 0;
                }
              }
            }
          }

          successCount++;
          return {
            exam_id: exam.id,
            question_text: questionText,
            options: options.slice(0, 4), // Ensure exactly 4 options
            correct_option: correctIdx,
            explanation: explanation
          };
        }).filter(q => q !== null);

        if (questionsToInsert.length > 0) {
          const { error } = await supabase.from('questions').insert(questionsToInsert);
          if (error) throw error;
          toast(`Uploaded ${successCount} questions.${skipCount > 0 ? ` Skipped ${skipCount} invalid rows.` : ''}`, 'success');
          fetchQuestions();
        } else {
          toast('No valid questions found. Check column headers.', 'warning');
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        toast('Error: ' + err.message, 'error');
      } finally {
        setIsUploading(false);
        e.target.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleJsonSubmit = async () => {
    try {
      if (!jsonInput.trim()) return;
      
      let cleanInput = jsonInput.trim();
      
      // Strip markdown code block wrapping (e.g., ```json ... ```)
      if (cleanInput.startsWith('```')) {
        cleanInput = cleanInput.replace(/^```[a-zA-Z]*\s*/, '');
        cleanInput = cleanInput.replace(/\s*```$/, '');
        cleanInput = cleanInput.trim();
      }

      // Strip outer quotes if pasted accidentally
      if (cleanInput.startsWith('"') && cleanInput.endsWith('"')) {
        cleanInput = cleanInput.slice(1, -1).trim();
      } else if (cleanInput.startsWith("'") && cleanInput.endsWith("'")) {
        cleanInput = cleanInput.slice(1, -1).trim();
      }

      let parsedData = JSON.parse(cleanInput);
      
      // Auto-extract 'data' array if the pasted JSON is an object container
      if (parsedData && !Array.isArray(parsedData) && Array.isArray(parsedData.data)) {
        parsedData = parsedData.data;
      }
      
      if (!Array.isArray(parsedData)) throw new Error('Data must be an array of questions');

      // Auto-detect 1-based vs 0-based indexing
      let isOneIndexed = false;
      let hasZero = false;
      let hasFour = false;

      parsedData.forEach(q => {
        const val = parseInt(q.correctOption || q.correct_option);
        if (val === 0) hasZero = true;
        if (val === 4) hasFour = true;
      });

      if (hasFour) {
        isOneIndexed = true;
      } else if (hasZero) {
        isOneIndexed = false;
      } else {
        // If there are no 0s and no 4s, but there is a 1, it is 1-indexed (Options 1-3)
        const hasOne = parsedData.some(q => parseInt(q.correctOption || q.correct_option) === 1);
        if (hasOne && !hasZero) {
          isOneIndexed = true;
        }
      }

      const questionsToInsert = parsedData.map(q => {
        let correctOpt = parseInt(q.correctOption || q.correct_option || 0);
        if (isOneIndexed && correctOpt >= 1) {
          correctOpt = correctOpt - 1;
        }
        return {
          exam_id: exam.id,
          question_text: q.question || q.question_text || '',
          options: q.options || [],
          correct_option: correctOpt,
          explanation: q.explanation || ''
        };
      }).filter(q => q.question_text && q.options.length >= 2);

      if (questionsToInsert.length === 0) throw new Error('No valid questions found in JSON');

      const { error } = await supabase.from('questions').insert(questionsToInsert);
      if (error) throw error;

      toast(`Successfully injected ${questionsToInsert.length} questions`, 'success');
      setJsonInput('');
      setIsJsonModalOpen(false);
      fetchQuestions();
    } catch (err) {
      toast('Invalid JSON: ' + err.message, 'error');
    }
  };

  return (
    <div className="manage-questions animate-fade-in relative z-10 w-full min-h-[500px]">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div>
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 mb-4 text-primary-500 hover:text-primary-400 transition-colors font-bold text-sm tracking-wide"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Exams
          </button>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight flex flex-col md:flex-row md:items-baseline gap-2" style={{ color: 'var(--text-dark)' }}>
            {exam.title} 
            <span className="font-medium opacity-50 text-xl tracking-normal" style={{ color: 'var(--text-light)' }}>- Questions</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
          <label className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm font-bold text-sm">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {isUploading ? 'Uploading...' : 'Upload File (Excel/CSV)'}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>

          <button 
            onClick={() => setIsJsonModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg font-bold text-sm"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            Paste JSON
          </button>
        </div>
      </div>

      {/* JSON Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsJsonModalOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] p-8 md:p-10 max-w-2xl w-full animate-slide-up shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Direct Code Injection</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Paste your JSON question array below</p>
              </div>
              <button 
                onClick={() => setIsJsonModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="relative mb-8">
              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[
  {
    "question": "Sample Question?",
    "options": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
    "correctOption": 1
  }
]'
                className="w-full h-[300px] bg-slate-50 border border-slate-100 rounded-3xl p-6 font-mono text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none outline-none"
              />
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-8 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Smarter Mapping Engine</h4>
                <p className="text-[11px] font-bold text-blue-800 leading-relaxed opacity-70">
                  Auto-detects: question/text, options/opt1, correctOption/ans . 1-indexed and 0-indexed values are handled automatically.
                </p>
              </div>
            </div>

            <button 
              onClick={handleJsonSubmit}
              disabled={!jsonInput.trim()}
              className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black tracking-[0.1em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/20 active:scale-[0.98] uppercase text-sm"
            >
              Inject Code into Database
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative max-w-full">
        {/* Add Question Form - Sticky on Desktop */}
        <div className="lg:col-span-5 glass-card-saas p-8 lg:sticky lg:top-8 w-full order-2 lg:order-1 animate-slide-up">
          <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3" style={{ color: 'var(--text-dark)' }}>
            <span className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            </span>
            Add Single Question
          </h3>
          
          <form onSubmit={handleAddQuestion} className="flex flex-col gap-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-light)] ml-2">Question Text</label>
              <textarea 
                placeholder="Enter question text here..." 
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                required
                className="input-premium w-full resize-y min-h-[120px] py-4"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-light)] ml-2">Options</label>
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center font-black pointer-events-none transition-colors group-focus-within:text-primary-500" style={{ color: 'var(--text-light)' }}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <input 
                    type="text" 
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...newQuestion.options];
                      newOpts[idx] = e.target.value;
                      setNewQuestion({...newQuestion, options: newOpts});
                    }}
                    required
                    className="input-premium w-full py-3"
                    style={{ paddingLeft: '3.5rem' }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-light)] ml-2">Correct Option</label>
              <div className="relative">
                <select 
                  value={newQuestion.correct_option}
                  onChange={(e) => setNewQuestion({...newQuestion, correct_option: e.target.value})}
                  className="input-premium w-full appearance-none py-3 cursor-pointer"
                >
                  {newQuestion.options.map((_, idx) => (
                    <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[color:var(--text-light)]">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-light)] ml-2">Explanation (Optional)</label>
              <textarea 
                placeholder="Optional explanation for the correct answer..." 
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                className="input-premium w-full resize-y min-h-[80px] py-3 text-sm"
              />
            </div>
            
            <button type="submit" className="btn-premium w-full !py-4 font-black tracking-wide flex items-center justify-center gap-2">
              Add Question
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
          </form>
          
          {/* Documentation Block */}
          <div className="mt-8 p-5 rounded-2xl border bg-primary-500/5" style={{ borderColor: 'var(--glass-border)' }}>
            <h4 className="font-black text-primary-500 text-sm tracking-wide flex items-center gap-2 mb-3">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Excel Format (.xlsx)
            </h4>
            <div className="space-y-2 text-xs font-medium" style={{ color: 'var(--text-light)' }}>
              <p>Supported Column Headers (Any of these sets):</p>
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {['question', 'opt1', 'opt2', 'opt3', 'opt4', 'correct_option', 'description'].map(h => (
                    <span key={h} className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 font-bold font-mono">{h}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Answer', 'Explanation'].map(h => (
                    <span key={h} className="px-2 py-1 rounded bg-slate-500/10 text-slate-500 font-bold font-mono">{h}</span>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[11px] opacity-70">* Answer can be A/B/C/D, 0-3, or exact option text.</p>
            </div>
          </div>
        </div>

        {/* Question Schema List */}
        <div className="lg:col-span-7 flex flex-col gap-6 order-1 lg:order-2 w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-dark)' }}>Existing Questions</h3>
            <span className="text-sm font-black bg-primary-500/10 text-primary-500 px-3 py-1 rounded-full border border-primary-500/20">{questions.length} Added</span>
          </div>
          
          <div className="flex flex-col gap-5 min-w-0 w-full animate-slide-up" style={{ animationDelay: '100ms' }}>
            {loading ? (
              <div className="py-12 flex justify-center w-full">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl w-full" style={{ borderColor: 'var(--glass-border)' }}>
                <svg className="text-slate-400 mb-4 opacity-30" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <p className="text-[color:var(--text-light)] font-bold text-lg">No questions added for this exam yet.</p>
              </div>
            ) : (
              questions.map((q, qIdx) => (
                <div key={q.id} className="glass-card-saas p-6 group hover:-translate-y-1 transition-all duration-300 w-full overflow-hidden">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <p className="font-bold text-lg leading-snug w-full" style={{ color: 'var(--text-dark)', wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%' }}>
                      <span className="text-primary-500 font-black mr-2">Q{qIdx + 1}.</span> 
                      <span className="break-words max-w-full">{q.question_text}</span>
                    </p>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="shrink-0 p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Question"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 w-full">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correct_option === optIdx;
                      return (
                        <div 
                          key={optIdx} 
                          className={`px-4 py-3 rounded-xl border flex gap-3 transition-colors min-w-0 ${
                            isCorrect 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold' 
                              : 'border-transparent font-medium'
                          }`}
                          style={!isCorrect ? { backgroundColor: 'var(--input-bg)', color: 'var(--text-light)' } : {}}
                        >
                          <span className={`${isCorrect ? 'text-emerald-500' : 'opacity-50 font-bold'} shrink-0`}>
                            {String.fromCharCode(65 + optIdx)}.
                          </span> 
                          <span className="break-words min-w-0" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>{opt}</span>
                          
                          {isCorrect && (
                            <span className="ml-auto shrink-0 flex items-center">
                              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {q.explanation && (
                    <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 mt-4 flex gap-3 w-full break-words">
                      <div className="shrink-0 mt-0.5 text-blue-500">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word', minWidth: 0, maxWidth: '100%' }}>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm uppercase tracking-wider block mb-1">Explanation</span>
                        <p className="text-sm font-medium leading-relaxed opacity-90 break-words" style={{ color: 'var(--text-dark)' }}>{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageQuestions;

