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
          <nav className="flex-2 flex justify-center items-center gap-2 md:gap-4">
            {!isExamActive && isAdminRoute && (
              <>
                <Link to="/admin" className={navLinkClass('/admin')}>
                  Exams
                </Link>
                <Link to="/admin/admissions" className={navLinkClass('/admin/admissions')}>
                  Admissions
                </Link>
                <Link to="/admin/users" className={navLinkClass('/admin/users')}>
                  Users
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
          <div className="flex-1 flex justify-end gap-4 md:gap-6 items-center">
            {isExamActive ? (
              <button 
                onClick={onSubmitExam} 
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-2 px-8 rounded-full text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 tracking-wide"
              >
                Submit Exam
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </button>
            ) : (isAdmin || isCandidate) ? (
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
