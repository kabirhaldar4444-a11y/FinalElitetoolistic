import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = ({ isAdmin, isCandidate, onLogout, isExamActive, onSubmitExam }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  
  const navLinkClass = (path) => `
    relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
    ${location.pathname === path 
      ? 'bg-primary-500/10 text-primary-500 font-bold' 
      : 'text-[color:var(--text-light)] hover:text-[color:var(--text-dark)] hover:bg-black/5 dark:hover:bg-white/5'}
  `;

  return (
    <div className="w-full flex justify-center pt-6 pb-2 px-4 sticky top-0 z-[1000]">
      <header className="px-6 md:px-8 h-16 flex items-center backdrop-blur-md border shadow-2xl rounded-full w-full max-w-5xl transition-all duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between w-full">
          {/* Left Section: Logo */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="flex items-center bg-white/95 rounded-xl px-4 py-1.5 shadow-md hover:scale-[1.03] transition-all duration-300">
              <img src="/logo_full.png" alt="Elitetoolistic" className="h-7 object-contain" />
            </Link>
          </div>

          {/* Center Section: Navigation (Hidden during exam) */}
          <nav className="flex-2 flex justify-center items-center gap-1.5 md:gap-2">
            {!isExamActive && isAdminRoute && (
              <>
                <Link 
                  to="/admin" 
                  className={`px-3.5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === '/admin' 
                      ? 'bg-primary-500/10 text-primary-600 shadow-sm' 
                      : 'text-[color:var(--text-light)] hover:text-[color:var(--text-dark)] hover:bg-black/5'
                  }`}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span className="hidden sm:inline">Exam Management</span>
                  <span className="sm:hidden">Exams</span>
                </Link>

                <Link 
                  to="/admin/users" 
                  className={`px-3.5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === '/admin/users' || location.pathname.startsWith('/admin/users/edit')
                      ? 'bg-primary-500/10 text-primary-600 shadow-sm' 
                      : 'text-[color:var(--text-light)] hover:text-[color:var(--text-dark)] hover:bg-black/5'
                  }`}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <span className="hidden sm:inline">User & Access</span>
                  <span className="sm:hidden">Users</span>
                </Link>

                <Link 
                  to="/admin/admissions" 
                  className={`px-3.5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === '/admin/admissions' 
                      ? 'bg-primary-500/10 text-primary-600 shadow-sm' 
                      : 'text-[color:var(--text-light)] hover:text-[color:var(--text-dark)] hover:bg-black/5'
                  }`}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span>Admissions</span>
                </Link>

                <Link 
                  to="/admin/servicedelivery" 
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                    location.pathname.includes('servicedelivery')
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02]' 
                      : 'text-[color:var(--text-light)] hover:text-[color:var(--text-dark)] hover:bg-black/5'
                  }`}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75A1.125 1.125 0 0013.125 2.625H3.375A1.125 1.125 0 002.25 3.75v10.5c0 .621.504 1.125 1.125 1.125h12" />
                  </svg>
                  <span>Service Delivery</span>
                </Link>
              </>
            )}

            {!isExamActive && isCandidate && !isAdminRoute && (
              <>
                <Link to="/" className={navLinkClass('/')}>
                  My Exams
                </Link>
                <Link to="/profile" className={navLinkClass('/profile')}>
                  Profile
                </Link>
              </>
            )}

            {!isExamActive && !isAdmin && !isCandidate && (
              <Link to="/admission" className={navLinkClass('/admission')}>
                Online Admission
              </Link>
            )}
          </nav>

          {/* Right Section: Actions */}
          <div className="flex-1 flex justify-end gap-3 md:gap-4 items-center">
            {isExamActive ? (
              <button 
                onClick={onSubmitExam} 
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-2 px-8 rounded-full text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 tracking-wide"
              >
                Submit Exam
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </button>
            ) : isAdmin ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200/80 text-fuchsia-700 text-xs font-black shadow-sm">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  <span>Super Admin</span>
                </div>
                <button 
                  onClick={() => { onLogout(); navigate('/'); }} 
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all shadow-sm active:scale-95 border border-slate-200/60"
                  title="Logout"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : isCandidate ? (
              <button 
                onClick={() => { onLogout(); navigate('/'); }} 
                className="bg-gradient-to-r from-primary-500 to-indigo-500 text-white font-bold py-2 px-6 rounded-full text-sm shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Logout
              </button>
            ) : (
              <div className="flex gap-4 items-center">
                <Link to="/login" className="text-[color:var(--text-dark)] hover:text-primary-500 font-semibold text-sm transition-colors">Login</Link>
                <Link to="/admin/login" className="text-primary-500 font-semibold text-sm border border-primary-500/50 hover:bg-primary-500/10 px-5 py-2 rounded-full transition-all">Admin Portal</Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
