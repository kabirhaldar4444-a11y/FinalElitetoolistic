import React from 'react';

const Profile = ({ profile }) => {
  return (
    <div className="min-h-[calc(100vh-80px)] relative overflow-hidden font-sans flex items-center justify-center p-6">
      {/* Background Blobs */}
      <div className="absolute top-1/4 -left-12 w-96 h-96 bg-primary-600/10 rounded-full blur-[128px] animate-blob pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] animate-blob animation-delay-2000 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-2xl animate-slide-up">
        <div className="glass-card-saas p-10 md:p-16 flex flex-col items-center text-center">
          {/* Avatar Section */}
          <div className="relative mb-8 group">
            <div className="absolute -inset-2 bg-gradient-to-tr from-primary-500 to-purple-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative w-32 h-32 rounded-full border-4 overflow-hidden shadow-2xl bg-slate-900" style={{ borderColor: 'var(--glass-border)' }}>
              {profile?.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={profile?.full_name} 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div 
                className="w-full h-full flex items-center justify-center text-5xl font-black"
                style={{ 
                  display: profile?.profile_photo_url ? 'none' : 'flex',
                  color: 'var(--text-dark)',
                  backgroundColor: 'var(--card-bg)'
                }}
              >
                {profile?.full_name?.charAt(0) || 'C'}
              </div>
            </div>
          </div>

          {/* Name & Title */}
          <div className="mb-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2 bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--text-dark), var(--text-light))' }}>
              {profile?.full_name || 'Candidate Name'}
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-xs font-bold uppercase tracking-widest text-primary-400">
              Verified Candidate Account
            </div>
          </div>
          
          {/* Info Details */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-6 border rounded-2xl space-y-1" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-light)' }}>Email Address</label>
              <p className="text-lg font-bold truncate" style={{ color: 'var(--text-dark)' }}>{profile?.email || 'N/A'}</p>
            </div>
            <div className="p-6 border rounded-2xl space-y-1" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-light)' }}>Access Role</label>
              <p className="text-lg font-bold capitalize" style={{ color: 'var(--text-dark)' }}>{profile?.role || 'candidate'}</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t w-full" style={{ borderColor: 'var(--glass-border)' }}>
            <p className="text-sm italic" style={{ color: 'var(--text-light)' }}>Account secured by Elitetoolistic Infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
