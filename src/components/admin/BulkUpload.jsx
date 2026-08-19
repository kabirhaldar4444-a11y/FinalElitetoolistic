import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import supabase from '../../utils/supabase';
import { useToast } from '../common/AlertProvider';

const BulkUpload = ({ onComplete, onClose }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef();
  const toast = useToast();

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    parseFile(uploadedFile);
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      // Map columns to standard format
      const mappedData = [];
      
      json.forEach(row => {
        const getVal = (keys) => {
          for (let k of keys) {
            const foundKey = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase() || rk.toLowerCase().includes(k.toLowerCase()));
            if (foundKey && row[foundKey] !== "") return String(row[foundKey]).trim();
          }
          return null;
        };

        const email = getVal(['email', 'mail']) || '';
        const name = getVal(['name', 'full name', 'student', 'candidate']) || '';
        const ip = getVal(['ip', 'ip address', 'ip adress', 'ip_address']) || '';
        
        let hasCourses = false;
        
        for (let i = 1; i <= 5; i++) {
          const courseKey = Object.keys(row).find(rk => rk.toLowerCase().trim() === `course ${i}`);
          const marksKey = Object.keys(row).find(rk => rk.toLowerCase().trim() === `marks - course ${i}`);
          
          if (courseKey && row[courseKey]) {
            hasCourses = true;
            mappedData.push({
              name,
              email,
              phone: '', 
              ip,
              subject: String(row[courseKey]).trim(),
              marks: marksKey && row[marksKey] ? parseInt(row[marksKey]) : null,
              total: 100 
            });
          }
        }
        
        if (!hasCourses) {
          // If no courses found, push just the user to create the account
          mappedData.push({
            name,
            email,
            phone: '',
            ip,
            subject: '',
            marks: null,
            total: 100
          });
        }
      });

      setPreviewData(mappedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (previewData.length === 0) return;
    
    // Filter out rows without email
    const validData = previewData.filter(r => r.email);
    if (validData.length === 0) {
      toast("No valid emails found in the spreadsheet.", "error");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error } = await supabase.rpc('admin_bulk_import_records', { payload: validData });
      
      if (error) throw error;
      
      setResults(data);
      if (data.success) {
        toast(`Successfully imported ${data.success_count} records.`, "success");
      }
    } catch (err) {
      console.error(err);
      toast(err.message || "An error occurred during bulk import.", "error");
    } finally {
      setIsUploading(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-4 rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>
        
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-white"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            </div>
            <div>
              <h3 className="text-white font-black text-base leading-none">Bulk Upload Users & Marks</h3>
              <p className="text-primary-200 text-xs mt-0.5">Upload CSV or Excel file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {!results ? (
            <>
              <div className="mb-6 p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-slate-50/5 hover:bg-slate-50/10 transition-colors"
                style={{ borderColor: 'var(--glass-border)' }}>
                <input 
                  type="file" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-bold shadow-lg transition-all"
                >
                  {file ? 'Choose Different File' : 'Select Excel / CSV File'}
                </button>
                <p className="mt-3 text-sm text-[color:var(--text-light)]">
                  Expected columns: Name, Email, Phone, Subject, Marks, Total
                </p>
              </div>

              {previewData.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-[color:var(--text-dark)]">Preview ({previewData.length} rows)</h4>
                    <span className="text-xs text-rose-400 font-medium">Rows without email will be skipped</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--glass-border)' }}>
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50/5 text-[color:var(--text-light)] font-medium">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">Subject</th>
                          <th className="px-4 py-3">Marks</th>
                          <th className="px-4 py-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-[color:var(--text-dark)]" style={{ divideColor: 'var(--glass-border)' }}>
                        {previewData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className={!row.email ? 'bg-rose-500/5' : ''}>
                            <td className="px-4 py-3">{row.name}</td>
                            <td className={`px-4 py-3 ${!row.email ? 'text-rose-400' : ''}`}>{row.email || 'Missing'}</td>
                            <td className="px-4 py-3">{row.phone}</td>
                            <td className="px-4 py-3">{row.subject}</td>
                            <td className="px-4 py-3">{row.marks}</td>
                            <td className="px-4 py-3">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.length > 10 && (
                    <p className="text-center text-xs mt-2 text-[color:var(--text-light)]">Showing first 10 rows...</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full font-bold text-[color:var(--text-light)] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={previewData.length === 0 || isUploading}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-full font-bold text-white bg-primary-500 hover:bg-primary-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isUploading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Importing...</>
                  ) : (
                    'Confirm Import'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${results.success_count > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {results.success_count > 0 ? (
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <h3 className="text-2xl font-black text-[color:var(--text-dark)] mb-2">Import Complete</h3>
              <p className="text-[color:var(--text-light)] mb-6">
                Successfully imported <strong className="text-emerald-500">{results.success_count}</strong> records. 
                {results.error_count > 0 && <span className="text-rose-500 ml-2">Failed: {results.error_count}</span>}
              </p>
              
              {results.errors?.length > 0 && (
                <div className="text-left bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 mb-6 max-h-40 overflow-y-auto">
                  <h4 className="text-sm font-bold text-rose-500 mb-2">Errors:</h4>
                  <ul className="text-xs space-y-1 text-rose-400">
                    {results.errors.map((err, i) => (
                      <li key={i}><strong>{err.email}</strong>: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-full font-bold text-white bg-primary-500 hover:bg-primary-600 shadow-lg transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
