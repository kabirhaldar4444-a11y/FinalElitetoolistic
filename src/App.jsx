import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import AdminDashboard from './components/admin/AdminDashboard';
import CandidateDashboard from './components/candidate/CandidateDashboard';
import ExamPortal from './components/candidate/ExamPortal';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Users from './pages/admin/Users';
import CreateUser from './components/admin/CreateUser';
import EditUser from './components/admin/EditUser';
import CompleteProfile from './pages/candidate/CompleteProfile';
import supabase from './utils/supabase';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const validateUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profile) {
        console.error('Session validation failed:', error);
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
      } else {
        setUser(user);
        setProfile(profile);
      }
    } catch (err) {
      console.error('Auth Guard Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateUser();

    // REALTIME: Listen for profile changes (exam allotment, role changes, etc.)
    const profileSubscription = supabase
      .channel('profile-updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user?.id}`
      }, (payload) => {
        setProfile(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user?.id]);

  const checkAuth = () => validateUser();

  useEffect(() => {
    if (user) fetchExams();
  }, [user, profile?.profile_completed]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*');
      if (data) setExams(data);
      if (error) console.error('Fetch Exams Error:', error);
    } catch (err) {
      console.error('Fetch Exams Exception:', err);
    }
  };

  const addExam = async (newExam) => {
    const { data, error } = await supabase
      .from('exams')
      .insert([newExam])
      .select();
    if (data) fetchExams();
  };

  const deleteExam = async (id) => {
    await supabase.from('exams').delete().eq('id', id);
    fetchExams();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    navigate('/login');
  };

  const [submitSignal, setSubmitSignal] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

  const isLoginRoute = location.pathname === '/login' || location.pathname === '/complete-profile';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="premium-container relative min-h-screen">
      {!isLoginRoute && (
        <Header 
          isAdmin={profile?.role === 'admin'} 
          isCandidate={profile?.role === 'candidate'}
          isExamActive={!!activeExam}
          onLogout={handleLogout}
          onSubmitExam={() => setSubmitSignal(prev => prev + 1)}
        />
      )}
      <main className={isLoginRoute ? 'p-0 max-w-none' : ''}>
        <Routes>
          <Route path="/login" element={
            user ? (
              !loading && !profile ? (
                <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center px-4 animate-fade-in">
                  <h2 className="text-4xl font-black text-red-500 tracking-tight">Profile Not Found</h2>
                  <p className="text-slate-400 max-w-md">Your account exists but we couldn't find your profile details.</p>
                  <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-all">Back to Login</button>
                </div>
              ) : (
                profile?.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/" />
              )
            ) : <Login onLoginSuccess={checkAuth} />
          } />
          
          <Route path="/" element={
            !user ? <Navigate to="/login" /> :
            profile?.role === 'candidate' ? (
              !profile?.profile_completed ? <Navigate to="/complete-profile" /> :
              activeExam ? (
                <ExamPortal exam={activeExam} onFinish={() => setActiveExam(null)} submitSignal={submitSignal} />
              ) : (
                <CandidateDashboard exams={exams} onStartExam={setActiveExam} profile={profile} user={user} />
              )
            ) : profile?.role === 'admin' ? <Navigate to="/admin" /> : (
              <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center px-4 animate-fade-in">
                <h2 className="text-4xl font-black text-red-500 tracking-tight">Identity Mismatch</h2>
                <p className="text-slate-400 max-w-md">We found your account but your profile details are missing or corrupted.</p>
                <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-all">Sign Out & Retry</button>
              </div>
            )
          } />

          <Route path="/complete-profile" element={
            profile?.role === 'candidate' ? (
              profile?.profile_completed ? <Navigate to="/" /> : <CompleteProfile profile={profile} user={user} onComplete={checkAuth} />
            ) : <Navigate to="/login" />
          } />

          <Route path="/profile" element={
            profile?.role === 'candidate' ? (
              <Profile profile={profile} />
            ) : <Navigate to="/login" />
          } />
          <Route path="/admin" element={
            profile?.role === 'admin' ? (
              <AdminDashboard user={user} profile={profile} exams={exams} addExam={addExam} deleteExam={deleteExam} onRefresh={fetchExams} />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin/users" element={
            profile?.role === 'admin' ? (
              <Users user={user} profile={profile} />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin/users/new" element={
            profile?.role === 'admin' ? (
              <CreateUser />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin/users/edit/:id" element={
            profile?.role === 'admin' ? (
              <EditUser user={user} />
            ) : <Navigate to="/login" />
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

    </div>
  );
}

export default App;
