import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';
import UserSubmissions from '../../components/admin/UserSubmissions';
import CreateUser from '../../components/admin/CreateUser';
import { useConfirm, useToast } from '../../components/common/AlertProvider';

const Users = ({ user, profile: activeProfile }) => {
  const confirm = useConfirm();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [docViewUrl, setDocViewUrl] = useState(null);
  const [docViewLabel, setDocViewLabel] = useState('');
  const [activeTab, setActiveTab] = useState('candidates');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const navigate = useNavigate();

  const isSuperAdmin = user?.email === 'kabirhaldar4444@gmail.com';

  useEffect(() => {
    fetchUsers();
    fetchExams();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (!isSuperAdmin) {
      query = query.eq('role', 'candidate');
    }

    const { data, error } = await query;
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchExams = async () => {
    const { data } = await supabase.from('exams').select('id, title').order('title');
    if (data) setExams(data);
  };

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'candidate' : 'admin';
    const isConfirmed = await confirm({
      title: `${newRole === 'admin' ? 'Grant Admin Access' : 'Revoke Admin Access'}`,
      message: `Are you sure you want to ${newRole === 'admin' ? 'grant admin access to' : 'revoke admin access from'} "${targetUser.full_name}"?`,
      type: 'warning',
      confirmText: 'Yes, Change Role'
    });

    if (!isConfirmed) return;

    setTogglingId(targetUser.id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUser.id);

    if (error) {
      toast('Error changing role: ' + error.message, 'error');
    } else {
      toast(`User successfully updated to ${newRole}!`, 'success');
      fetchUsers();
    }
    setTogglingId(null);
  };

  const handleToggleExamLock = async (u) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_exam_locked: !u.is_exam_locked })
      .eq('id', u.id);
    if (!error) fetchUsers();
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.email === 'kabirhaldar4444@gmail.com') {
      toast('The Master Admin account cannot be deleted.', 'error');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Permanently Delete User',
      message: `Are you sure you want to delete "${targetUser.full_name}"? This will permanently remove their profile, submissions, and login access.`,
      type: 'error',
      confirmText: 'Delete Permanently'
    });
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: targetUser.id });
      if (error) throw new Error(error.message || 'Failed to delete user account.');
      setUsers(users.filter(u => u.id !== targetUser.id));
      toast('User deleted successfully!', 'success');
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoleUsers = users.filter(u =>
    u.role === 'admin' &&
    u.email !== 'kabirhaldar4444@gmail.com' && (
      u.full_name?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(roleSearchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-primary-500/30 pt-10">
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary-600/10 rounded-full blur-[128px] animate-blob pointer-events-none"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] animate-blob animation-delay-2000 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 animate-fade-in">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-[color:var(--text-dark)]">
              {isSuperAdmin ? 'Platform Management' : 'All Candidates'}
            </h1>
            <p className="text-[color:var(--text-light)] font-medium italic">
              {isSuperAdmin ? 'Manage administrative staff and student access' : 'View and manage candidate accounts and exam access'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'candidates' && (
              <div className="relative group w-full md:w-80">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all backdrop-blur-md"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-dark)' }}
                />
              </div>
            )}
            <Link to="/admin/users/new">
              <button className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-sm">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                New User
              </button>
            </Link>
          </div>
        </div>

        {/* ── TAB NAVIGATION (super admin only) ── */}
        {isSuperAdmin && (
          <div className="flex gap-2 mb-10 p-1.5 rounded-2xl w-fit" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>
            {[
              { id: 'candidates', label: 'Candidates', icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
              { id: 'roles', label: 'Admin Roles', icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-[color:var(--text-light)] hover:text-[color:var(--text-dark)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── CANDIDATES TAB ── */}
        {activeTab === 'candidates' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { label: 'Total Users', value: users.length },
                { label: 'Active Access', value: users.filter(u => !u.is_exam_locked).length },
                { label: 'Staff Admins', value: users.filter(u => u.role === 'admin').length }
              ].map((stat, i) => (
                <div key={i} className="glass-card-saas p-6 border-l-4 border-l-primary-500 flex flex-col gap-1 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-light)]">{stat.label}</span>
                  <span className="text-4xl font-extrabold tracking-tight text-[color:var(--text-dark)]">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-full py-20 text-center animate-pulse">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400 font-medium">Loading participants...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="col-span-full py-20 text-center glass-card-saas">
                  <p className="text-slate-400 font-medium">No users found matching your search.</p>
                </div>
              ) : (
                filteredUsers.map((u, i) => (
                  <div
                    key={u.id}
                    className={`glass-card-saas p-8 flex flex-col gap-6 hover:-translate-y-2 hover:shadow-primary-500/10 animate-slide-up group ${u.is_exam_locked ? 'opacity-60 saturate-50' : 'opacity-100'}`}
                    style={{ animationDelay: `${(i % 9) * 100}ms` }}
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
                          {u.profile_photo_url ? (
                            <img src={u.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold tracking-tight line-clamp-1 text-[color:var(--text-dark)]">{u.full_name || 'Unnamed'}</h3>
                        <p className="text-sm font-medium text-[color:var(--text-light)] line-clamp-1">{u.email || 'No email'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {u.role === 'admin' ? (
                        <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter text-purple-400 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          Admin Staff
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter text-primary-400">
                          {u.allotted_exam_ids?.length || 0} Assignments
                        </div>
                      )}
                      {u.is_exam_locked && (
                        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter text-rose-400">
                          Locked
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-2.5 rounded-xl hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-300"
                          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-light)' }}
                          title="View Details"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button
                          onClick={() => navigate(`/admin/users/edit/${u.id}`)}
                          className="p-2.5 rounded-xl hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-300"
                          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-light)' }}
                          title="Edit"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2.5 rounded-xl hover:text-rose-400 hover:bg-rose-400/10 transition-all duration-300"
                          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-light)' }}
                          title="Delete User"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleExamLock(u)}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${u.is_exam_locked ? 'bg-rose-500/10 text-rose-400' : 'bg-primary-500/10 text-primary-400'}`}
                        title={u.is_exam_locked ? 'Unlock Access' : 'Lock Access'}
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          {u.is_exam_locked ? (
                            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          ) : (
                            <path d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── ADMIN ROLES TAB ── */}
        {activeTab === 'roles' && isSuperAdmin && (
          <div className="animate-fade-in">
            {/* Roles summary banner */}
            <div className="glass-card-saas p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[color:var(--text-dark)] mb-1 flex items-center gap-3">
                    <span className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </span>
                    Admin Access Control
                  </h2>
                  <p className="text-sm font-medium text-[color:var(--text-light)]">Toggle admin privileges for any user. A confirmation is required before every change.</p>
                </div>
                <div className="flex flex-wrap gap-4 items-center shrink-0">
                  <div className="flex gap-3 text-center">
                    <div className="px-5 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                      <div className="text-2xl font-black text-purple-500">{users.filter(u => u.role === 'admin' && u.email !== 'info@elitetoolistic.com').length}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mt-0.5">Staff Admins</div>
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-slate-500/10 border border-slate-300/30">
                      <div className="text-2xl font-black text-[color:var(--text-dark)]">{users.filter(u => u.role === 'candidate').length}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-light)] mt-0.5">Candidates</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateAdmin(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all duration-300 text-sm whitespace-nowrap"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                    Add New Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative group w-full md:w-96 mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={roleSearchQuery}
                onChange={e => setRoleSearchQuery(e.target.value)}
                className="w-full rounded-full pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-dark)' }}
              />
            </div>

            {/* Role toggle list */}
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-medium" style={{ color: 'var(--text-light)' }}>Loading users...</p>
              </div>
            ) : filteredRoleUsers.length === 0 ? (
              <div className="py-16 text-center glass-card-saas">
                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-500">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <p className="font-bold text-[color:var(--text-dark)] mb-1">No staff admins yet</p>
                <p className="text-sm font-medium text-[color:var(--text-light)] mb-4">Click "Add New Admin" to create your first staff administrator.</p>
                <button
                  onClick={() => setShowCreateAdmin(true)}
                  className="inline-flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 font-bold py-2.5 px-6 rounded-full transition-all text-sm"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                  Add New Admin
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredRoleUsers.map((u, i) => {
                  const isAdmin = u.role === 'admin';
                  const isToggling = togglingId === u.id;

                  return (
                    <div
                      key={u.id}
                      className="glass-card-saas px-6 py-4 flex items-center gap-5 hover:shadow-lg transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`absolute -inset-1 rounded-xl blur-sm transition-all duration-500 ${isAdmin ? 'bg-gradient-to-br from-purple-400 to-indigo-500 opacity-40' : 'opacity-0'}`}></div>
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>
                          {u.profile_photo_url ? (
                            <img src={u.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--text-light)' }}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          )}
                        </div>
                      </div>

                      {/* Name & email */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-[color:var(--text-dark)] truncate">{u.full_name || 'Unnamed User'}</h3>
                        <p className="text-xs text-[color:var(--text-light)] truncate">{u.email}</p>
                      </div>

                      {/* Role pill */}
                      <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                        isAdmin
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-500'
                          : 'border-[color:var(--glass-border)] text-[color:var(--text-light)]'
                      }`} style={isAdmin ? {} : { backgroundColor: 'var(--input-bg)' }}>
                        {isAdmin ? (
                          <><svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Admin</>
                        ) : (
                          <><svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>User</>
                        )}
                      </div>

                      {/* Toggle group */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold hidden sm:block select-none" style={{ color: 'var(--text-light)' }}>Admin Access</span>
                        {/* Pill toggle */}
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isToggling}
                          title={isAdmin ? 'Revoke Admin Access' : 'Grant Admin Access'}
                          aria-pressed={isAdmin}
                          className={`relative inline-flex w-14 h-7 rounded-full items-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                            isAdmin ? 'bg-purple-500 shadow-lg shadow-purple-500/30' : ''
                          }`}
                          style={isAdmin ? {} : { backgroundColor: 'var(--glass-border)' }}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 ease-in-out ${isAdmin ? 'translate-x-7' : 'translate-x-0'}`}
                          >
                            {isToggling ? (
                              <svg className="animate-spin w-3 h-3 text-purple-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                              </svg>
                            ) : isAdmin ? (
                              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="text-purple-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            ) : (
                              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="text-slate-400"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CREATE ADMIN MODAL ── */}
      {showCreateAdmin && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in bg-black/60 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateAdmin(false); }}
        >
          <div className="relative w-full max-w-md my-4 rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>

            {/* Header with close button always visible */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h3 className="text-white font-black text-base leading-none">Create Staff Admin</h3>
                  <p className="text-purple-200 text-xs mt-0.5">New account will have full admin privileges</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAdmin(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90 shrink-0"
                title="Close"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Compact form body */}
            <div className="p-5 max-h-[75vh] overflow-y-auto">
              <CreateUser user={user} profile={activeProfile} initialRole="admin" />
            </div>
          </div>
        </div>
      )}


      {/* ── DETAIL MODAL ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10 backdrop-blur-xl animate-fade-in bg-black/60">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>

            {/* ── STICKY HEADER (always visible) ── */}
            <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-primary-500 to-purple-600 rounded-xl blur opacity-30"></div>
                  <img
                    src={selectedUser.profile_photo_url || 'https://via.placeholder.com/200'}
                    alt=""
                    className="relative w-12 h-12 rounded-xl object-cover border-2"
                    style={{ borderColor: 'var(--glass-border)' }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-[color:var(--text-dark)] leading-none">{selectedUser.full_name}</h2>
                  <p className="text-sm font-medium text-primary-400 mt-0.5">{selectedUser.email}</p>
                </div>
              </div>
              <button
                id="student-modal-close"
                onClick={() => setSelectedUser(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-rose-500/10 hover:text-rose-400 transition-all shrink-0"
                style={{ color: 'var(--text-light)', border: '1px solid var(--glass-border)' }}
                title="Close"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-0">

            {/* ── Personal Info ── */}
            <div className="flex flex-col sm:flex-row gap-6 mb-10 p-6 rounded-2xl" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>
              <div className="relative group shrink-0">
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary-500 to-purple-600 rounded-3xl blur opacity-30"></div>
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl bg-slate-800">
                  <img
                    src={selectedUser.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.full_name || 'U')}&background=random`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.full_name || 'U')}&background=6366f1&color=fff`; }}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-light)' }}>
                  <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Personal Details
                </div>
                <h3 className="text-3xl font-black tracking-tight leading-none text-[color:var(--text-dark)]">{selectedUser.full_name}</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary-400">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-light)]">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    {isSuperAdmin ? (selectedUser.phone || 'No contact provided') : 'Hidden for Privacy'}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-light)]">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {isSuperAdmin ? (selectedUser.address || 'No location provided') : 'Hidden for Privacy'}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Documents Section ── */}
            {isSuperAdmin ? (
              <div className="pt-10 mb-10 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                <h3 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-3 text-[color:var(--text-dark)]">
                  <span className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </span>
                  Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {[
                    { label: 'Aadhar Card (Front)', url: selectedUser.aadhaar_front_url },
                    { label: 'Aadhar Card (Back)',  url: selectedUser.aadhaar_back_url  },
                    { label: 'PAN Card',           url: selectedUser.pan_url           },
                  ].map(({ label, url }) => {
                    const isPdf = url && url.toLowerCase().includes('.pdf');
                    const fileType = !url ? 'none' : isPdf ? 'PDF Document' : 'Image File';
                    return (
                      <div
                        key={label}
                        className="flex flex-col gap-4 p-5 rounded-2xl transition-all duration-300"
                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}
                      >
                        {/* Image/PDF Preview Card */}
                        <div className="relative h-48 rounded-xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center bg-slate-50 transition-all group-hover:border-primary-300"
                          style={{ borderColor: 'var(--glass-border)' }}>
                          {url ? (
                            isPdf ? (
                              <div className="flex flex-col items-center gap-3">
                                <svg width="40" height="40" fill="none" stroke="#818cf8" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/><polyline points="13 3 13 9 19 9" stroke="#818cf8" strokeWidth="2"/></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">PDF Document</span>
                              </div>
                            ) : (
                              <img 
                                src={url} 
                                alt={label} 
                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500"
                                onClick={() => { setDocViewLabel(label); setDocViewUrl(url); }}
                              />
                            )
                          ) : (
                            <div className="flex flex-col items-center gap-3 text-slate-300">
                              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No Document</span>
                            </div>
                          )}
                        </div>

                        {/* Info row */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <p className="font-bold text-sm text-[color:var(--text-dark)]">{label}</p>
                            <p className="text-[10px] font-medium" style={{ color: 'var(--text-light)' }}>{fileType}</p>
                          </div>
                          {url ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Uploaded</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">Missing</span>
                          )}
                        </div>

                        {/* Action buttons */}
                        {url && (
                          <div className="flex gap-3 mt-1">
                            <button
                              id={`doc-view-${label.replace(/\s+/g, '-').toLowerCase()}`}
                              onClick={() => { setDocViewLabel(label); setDocViewUrl(url); }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95"
                              style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                            >
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                              View
                            </button>
                            <a
                              id={`doc-download-${label.replace(/\s+/g, '-').toLowerCase()}`}
                              href={url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 no-underline"
                              style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                            >
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="pt-10 mb-10 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="p-6 rounded-2xl flex items-center gap-4 bg-orange-500/10 border border-orange-500/20">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-500 mb-1">Privacy Protected</h3>
                    <p className="text-sm font-medium text-[color:var(--text-light)]">Personal identity documents are restricted for privacy. Only Master Admins can view this information.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Exam Results ── */}
            <div className="pt-10 border-t" style={{ borderColor: 'var(--glass-border)' }}>
              <h3 className="text-2xl font-black mb-8 tracking-tight text-[color:var(--text-dark)]">Exam Results</h3>
              <UserSubmissions userId={selectedUser.id} />
            </div>

            {/* Bottom close button */}
            <div className="pt-8 pb-2 flex justify-center">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-light)', border: '1px solid var(--glass-border)' }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                Close Profile
              </button>
            </div>

            </div>{/* end scrollable body */}
          </div>
        </div>
      )}

      {/* ── DOCUMENT VIEWER MODAL ── */}
      {docViewUrl && (
        <div
          className="fixed inset-0 z-[4000] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in bg-black/80"
          onClick={(e) => { if (e.target === e.currentTarget) setDocViewUrl(null); }}
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <svg width="16" height="16" fill="none" stroke="#818cf8" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                  <h4 className="font-black text-sm text-[color:var(--text-dark)]">{docViewLabel}</h4>
                  <p className="text-xs" style={{ color: 'var(--text-light)' }}>{docViewUrl.toLowerCase().includes('.pdf') ? 'PDF Document' : 'Image Preview'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={docViewUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all hover:scale-105 no-underline"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download
                </a>
                <button
                  id="doc-viewer-close-btn"
                  onClick={() => setDocViewUrl(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-rose-500/10 hover:text-rose-400"
                  style={{ color: 'var(--text-light)' }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-auto min-h-0 p-4">
              {docViewUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={docViewUrl}
                  title={docViewLabel}
                  className="w-full rounded-xl border"
                  style={{ height: '65vh', borderColor: 'var(--glass-border)' }}
                />
              ) : (
                <div className="flex items-center justify-center min-h-[300px]">
                  <img
                    src={docViewUrl}
                    alt={docViewLabel}
                    className="max-w-full max-h-[65vh] rounded-2xl shadow-2xl object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
