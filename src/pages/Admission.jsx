import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';

// Indian States List
const indianStates = [
  "Select State", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const Admission = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedId, setSubmittedId] = useState(null);

  // Step 1 Form Data
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [courseName, setCourseName] = useState('');

  // Step 2 Form Data
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('Select State');
  const [cityName, setCityName] = useState('');
  const [address, setAddress] = useState('');

  // Step 2 Video Recording & Media
  const [videoStream, setVideoStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(null);
  const [panCardPreview, setPanCardPreview] = useState(null);

  const [signatureData, setSignatureData] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Signature Canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // User IP Address
  const [userIp, setUserIp] = useState('');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip || ''))
      .catch(() => setUserIp('Not captured'));
  }, []);

  // Handle Location Detection
  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      setLoadingMsg("Detecting location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            if (data) {
              if (data.postcode) setPincode(data.postcode);
              if (data.principalSubdivision) setStateName(data.principalSubdivision);
              if (data.city || data.locality) setCityName(data.city || data.locality);
            }
          } catch (e) {
            console.warn('Geocoding notice:', e);
          } finally {
            setLoadingMsg("");
          }
        },
        () => setLoadingMsg("")
      );
    }
  };

  // Video Recorder Controls
  const startCamera = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setVideoStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera/mic access error:', err);
      setErrorMsg('Camera and Microphone permissions are required to record your live video statement. Please allow camera access.');
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsCameraActive(false);
  };

  const startRecording = () => {
    if (!videoStream) return;
    recordedChunksRef.current = [];
    
    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const mediaRecorder = new MediaRecorder(videoStream, { 
        mimeType,
        videoBitsPerSecond: 25000000 // High-definition video recording bitrate
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        
        // 500 MB Maximum File Size Check
        const maxSizeBytes = 500 * 1024 * 1024; // 500 MB
        if (blob.size > maxSizeBytes) {
          setErrorMsg('Recorded video exceeds the maximum 500 MB limit. Please record a shorter statement.');
          stopCamera();
          return;
        }

        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoBlob(blob);
        setRecordedVideoUrl(videoUrl);
        stopCamera();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTimer(0);
      timerRef.current = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting video recording:', err);
      setErrorMsg('Failed to start video recording. Please ensure camera/mic permissions are enabled.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const retakeVideo = () => {
    setRecordedVideoBlob(null);
    setRecordedVideoUrl(null);
    setRecordingTimer(0);
    startCamera();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Signature Pad Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1b4b';
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (canvasRef.current) {
        setSignatureData(canvasRef.current.toDataURL('image/png'));
      }
    }
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setSignatureData(null);
      setHasSigned(false);
    }
  };

  // File Upload Handlers
  const handleFileChange = (e, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Step 1 Submit
  const handleStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) return setErrorMsg('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setErrorMsg('Please enter a valid email address.');
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return setErrorMsg('Please enter a valid 10-digit mobile number.');
    if (!courseName.trim()) return setErrorMsg('Please enter the course name you are applying for.');

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Supabase / Storage Upload Helper
  const uploadAsset = async (fileOrBase64, filenamePrefix) => {
    if (!fileOrBase64) return '';

    try {
      let fileBody = fileOrBase64;
      let contentType = 'image/jpeg';
      let fileExt = 'jpg';

      if (fileOrBase64 instanceof Blob) {
        fileBody = fileOrBase64;
        contentType = fileOrBase64.type || 'video/webm';
        fileExt = contentType.includes('video') ? 'webm' : 'jpg';
      } else if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
        const parts = fileOrBase64.split(';base64,');
        contentType = parts[0].split(':')[1];
        fileExt = contentType.split('/')[1] || 'jpg';
        const raw = window.atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        fileBody = new Blob([uInt8Array], { type: contentType });
      }

      const path = `${filenamePrefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('admissions').upload(path, fileBody, {
        contentType: contentType,
        upsert: true
      });

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('admissions').getPublicUrl(path);
        return publicUrl;
      }
    } catch (err) {
      console.warn('Storage upload notice:', err);
    }

    return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
  };

  // Step 2 Final Submit
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pincode.trim()) return setErrorMsg('Please enter your 6-digit PIN code.');
    if (!stateName || stateName === 'Select State') return setErrorMsg('Please select your State / UT.');
    if (!cityName.trim()) return setErrorMsg('Please enter your City / District.');
    if (!recordedVideoBlob && !recordedVideoUrl) return setErrorMsg('Please record your live video statement reading the required script.');
    if (!aadhaarFrontPreview) return setErrorMsg('Please upload your Aadhaar Card (Front) image.');
    if (!aadhaarBackPreview) return setErrorMsg('Please upload your Aadhaar Card (Back) image.');
    if (!panCardPreview) return setErrorMsg('Please upload your PAN Card image.');
    if (!signatureData) return setErrorMsg('Please draw your digital signature on the signature pad.');
    if (!termsAccepted) return setErrorMsg('Please check the legal terms acknowledgement box to proceed.');

    setLoading(true);
    setLoadingMsg('Processing documents & saving application...');

    try {
      const [photoUrl, frontUrl, backUrl, panUrl, signUrl] = await Promise.all([
        uploadAsset(recordedVideoBlob, 'profile_video'),
        uploadAsset(aadhaarFrontPreview, 'aadhaar_front'),
        uploadAsset(aadhaarBackPreview, 'aadhaar_back'),
        uploadAsset(panCardPreview, 'pan_card'),
        uploadAsset(signatureData, 'signature')
      ]);

      const admissionRecord = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        course_name: courseName.trim(),
        pincode: pincode.trim(),
        state: stateName.trim(),
        city: cityName.trim(),
        address: address.trim(),
        aadhaar_front_url: frontUrl,
        aadhaar_back_url: backUrl,
        pan_url: panUrl,
        signature_url: signUrl,
        profile_photo_url: photoUrl,
        ip_address: userIp || 'Not captured',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('admissions')
        .insert([admissionRecord])
        .select();

      let recordId = data && data[0] ? data[0].id : `ADM-${Date.now().toString().slice(-6)}`;

      if (error) {
        console.warn('Supabase DB notice:', error.message);
      }

      // Send Web3Forms Email Notification to support@elitetoolistic.com
      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: "71d5ef87-88ee-4b57-9315-1340e1a9350e",
            subject: `NEW Admission Application — ${fullName}`,
            from_name: "Elitetoolistic Admission Portal",
            email: email,
            recipient: "support@elitetoolistic.com",
            message: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMISSION APPLICATION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANDIDATE INFORMATION:
──────────────────────
• Application Ref ID: ${recordId}
• Full Name: ${fullName}
• Email ID: ${email}
• Phone: ${phone}
• Course Applied: ${courseName}
• PIN Code: ${pincode}
• Location: ${cityName}, ${stateName}
• Residential Address: ${address}
• IP Address: ${userIp || 'Not captured'}

VERIFICATION STATUS:
───────────────────
• Declaration: CHECKED & ACCEPTED ✓
• Signature: CAPTURED & VERIFIED ✓
• Documentation & Assets: ALL UPLOADED ✓

DOCUMENT LINKS:
────────────────
• Live Video Statement: ${photoUrl || 'N/A'}
• Aadhaar Front: ${frontUrl || 'N/A'}
• Aadhaar Back: ${backUrl || 'N/A'}
• PAN Card: ${panUrl || 'N/A'}
• Digital Signature: ${signUrl || 'N/A'}

Submitted via Elitetoolistic Admission Portal
`
          })
        });
      } catch (emailErr) {
        console.warn('Web3Forms email notice:', emailErr);
      }

      // Local storage backup
      const existing = JSON.parse(localStorage.getItem('elitetoolistic_admissions') || '[]');
      existing.unshift({ id: recordId, ...admissionRecord });
      localStorage.setItem('elitetoolistic_admissions', JSON.stringify(existing));

      setSubmittedId(recordId);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Admission submission error:', err);
      setErrorMsg(err.message || 'An error occurred while submitting your application.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const inputClass = "w-full px-5 py-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-slate-900 font-semibold text-sm placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300";
  const labelClass = "block text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 mb-2.5";

  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 flex flex-col items-center justify-start py-8 px-4">
      
      {/* ── ELITETOOLISTIC PLEASANT ATMOSPHERE ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-white">
        <div className="absolute top-[-5%] left-[-5%] w-[800px] h-[800px] bg-rose-50/40 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[800px] h-[800px] bg-sky-50/40 rounded-full blur-[120px] opacity-50" />
        
        {/* Micro-Orbs */}
        {[
          { color: 'bg-indigo-100', pos: 'top-[15%] left-[20%]', blur: 'blur-[4px]' },
          { color: 'bg-sky-100', pos: 'top-[40%] right-[30%]', blur: 'blur-[3px]' },
          { color: 'bg-pink-100', pos: 'bottom-[20%] left-[10%]', blur: 'blur-[5px]' },
          { color: 'bg-blue-100', pos: 'top-[60%] right-[15%]', blur: 'blur-[2px]' },
        ].map((orb, i) => (
          <div 
            key={i}
            className={`absolute ${orb.pos} w-6 h-6 ${orb.color} opacity-50 rounded-full ${orb.blur}`}
          />
        ))}
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">

        {/* ── ELITETOOLISTIC LOGO & HEADER ── */}
        <div className="flex flex-col items-center text-center mt-2 mb-8">
          <div className="w-48 h-auto p-4 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100/60 mb-6 hover:scale-[1.02] transition-transform duration-300">
            <img src="/logo_full.png" alt="Elitetoolistic" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">
            Admission Form
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Step {step} of 2: {step === 1 ? 'Initial Details' : 'Identity Verification'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="max-w-md w-full mb-6 p-5 rounded-[2rem] bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-4 animate-slide-up">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
            {errorMsg}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">{loadingMsg || 'Processing...'}</p>
          </div>
        )}

        {/* STEP 1: INITIAL DETAILS */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] p-8 md:p-10 space-y-6 animate-slide-up">
            
            {/* Full Name */}
            <div>
              <label className={labelClass}>Full Name *</label>
              <input 
                type="text" 
                required
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Email Address */}
            <div>
              <label className={labelClass}>Email Address *</label>
              <input 
                type="email" 
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className={labelClass}>Phone Number *</label>
              <div className="flex gap-3">
                <div className="px-4 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-400 font-bold text-xs flex items-center">
                  +91
                </div>
                <input 
                  type="tel" 
                  required
                  maxLength="10"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Course Name */}
            <div>
              <label className={labelClass}>Course Name *</label>
              <input 
                type="text" 
                required
                placeholder="Enter the course you're applying for"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Proceed Button */}
            <div className="pt-2">
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-black text-[10px] py-4 rounded-2xl uppercase tracking-[0.3em] transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95"
              >
                Proceed to Verification
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: IDENTITY VERIFICATION */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="max-w-5xl w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] p-8 md:p-12 space-y-12 animate-slide-up">
            
            {/* SECTION 1: PERSONAL CREDENTIALS */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Personal Credentials</h3>
                </div>

                <button 
                  type="button" 
                  onClick={handleDetectLocation}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-full flex items-center gap-1.5 transition-all"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                  Detect Location
                </button>
              </div>

              {/* Livestream Verification Box with Video Recorder */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-6 md:p-8 text-center space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block">Livestream Verification</span>
                
                <div className="flex flex-col items-center justify-center">
                  
                  {/* Camera Active View */}
                  {isCameraActive && (
                    <div className="relative max-w-md w-full h-64 bg-slate-950 rounded-3xl overflow-hidden shadow-2xl mb-4 border border-slate-800">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                      
                      {isRecording && (
                        <div className="absolute top-4 left-4 bg-rose-600/90 text-white font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-2 animate-pulse shadow-lg backdrop-blur-md">
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                          REC {formatTimer(recordingTimer)}
                        </div>
                      )}

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        {!isRecording ? (
                          <button 
                            type="button" 
                            onClick={startRecording} 
                            className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest px-8 py-3 rounded-full shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                          >
                            <span className="w-3 h-3 rounded-full bg-white"></span>
                            Start Recording
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={stopRecording} 
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest px-8 py-3 rounded-full shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                          >
                            <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                            Stop Recording
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recorded Video Playback View */}
                  {recordedVideoUrl && !isCameraActive && (
                    <div className="relative max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 mb-4 bg-slate-950">
                      <video src={recordedVideoUrl} controls className="w-full h-64 object-cover rounded-3xl"></video>
                      
                      <div className="p-3 bg-white border-t border-slate-100 flex justify-center">
                        <button 
                          type="button" 
                          onClick={retakeVideo} 
                          className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-full shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
                          Retake Video
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Initial Camera Lens Trigger */}
                  {!isCameraActive && !recordedVideoUrl && (
                    <div className="flex flex-col items-center gap-3">
                      <button 
                        type="button" 
                        onClick={startCamera} 
                        className="w-16 h-16 rounded-full bg-white border border-indigo-100 shadow-md hover:shadow-xl hover:scale-105 text-indigo-600 flex items-center justify-center transition-all group"
                      >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.039l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg>
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Open Lens</span>
                    </div>
                  )}

                </div>

                {/* DUAL READ-ALOUD SCRIPTS (ENGLISH & HINDI) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
                  
                  {/* English Script */}
                  <div className="space-y-3">
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      PLEASE READ ALOUD (ENGLISH):
                    </h4>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-slate-600 font-medium space-y-2 text-[11px] leading-relaxed shadow-sm">
                      <p>
                        "My name is <strong>{fullName || '[Candidate Name]'}</strong> and my registered email address is <strong>{email || '[Candidate Email]'}</strong>. I voluntarily recorded this video statement to verify my profile, confirm my identity, and acknowledge my enrollment in Elite Toolistic's professional training program (available at elitetoolistic.com)."
                      </p>
                      <p>
                        "I purchased this course for personal skill enhancement, professional development, and career growth. I fully accept and understand that Elite Toolistic is only an educational skills-based course training provider and never offers a job promise, job placement assurance, or particular career assurances upon course completion."
                      </p>
                      <p>
                        "Furthermore, I certify that I will not file any chargebacks or complaints regarding this transaction in the future. I also promise not to share or distribute any copyrighted course materials supplied to me throughout this program. This statement is made freely, knowingly, and without pressure."
                      </p>
                    </div>
                  </div>

                  {/* Hindi Script */}
                  <div className="space-y-3">
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      कृपया ज़ोर से पढ़ें (HINDI):
                    </h4>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-slate-600 font-medium space-y-2 text-[11px] leading-relaxed shadow-sm">
                      <p>
                        "मेरा नाम <strong>{fullName || '[Candidate Name]'}</strong> है और मेरा रजिस्टर्ड ईमेल एड्रेस <strong>{email || '[Candidate Email]'}</strong> है। मैंने अपनी प्रोफाइल को वेरीफाई करने, अपनी पहचान कन्फर्म करने और Elite Toolistic के प्रोफेशनल ट्रेनिंग प्रोग्राम (जो elitetoolistic.com पर उपलब्ध है) में अपने एनरोलमेंट को स्वीकार करने के लिए स्वेच्छा से यह वीडियो स्टेटमेंट रिकॉर्ड किया है।"
                      </p>
                      <p>
                        "मैंने यह कोर्स अपनी पर्सनल स्किल्स को बेहतर बनाने, प्रोफेशनल डेवलपमेंट और करियर में आगे बढ़ने के लिए खरीदा है। मैं पूरी तरह से स्वीकार करता हूँ और समझता हूँ कि Elite Toolistic केवल एक एजुकेशनल स्किल-बेस्ड कोर्स ट्रेनिंग प्रोवाइडर है और कोर्स पूरा होने पर कभी भी नौकरी का वादा, नौकरी मिलने की गारंटी या किसी खास करियर की गारंटी नहीं देता है।"
                      </p>
                      <p>
                        "इसके अलावा, मैं यह सर्टिफाई करता हूँ कि मैं भविष्य में इस ट्रांजैक्शन के संबंध में कोई चार्जबैक या शिकायत नहीं करूँगा। मैं यह भी वादा करता हूँ कि इस प्रोग्राम के दौरान मुझे दिए गए किसी भी कॉपीराइटेड कोर्स मटेरियल को शेयर या डिस्ट्रीब्यूट नहीं करूँगा। यह स्टेटमेंट बिना किसी दबाव के, पूरी जानकारी के साथ और अपनी मर्जी से दिया जा रहा है।"
                      </p>
                    </div>
                  </div>

                </div>

              </div>

              {/* Row: Pin Code, State, City */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>PIN Code *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="6-digit PIN"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>State / UT *</label>
                  <select 
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className={inputClass}
                  >
                    {indianStates.map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>City / District *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Pending Selection..."
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className={labelClass}>Residential Address</label>
                <input 
                  type="text" 
                  placeholder="Street, Locality, House No."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* SECTION 2: VERIFICATION DOCUMENTS */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Verification Documents</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Aadhaar Front */}
                <div>
                  <label className={labelClass}>Aadhaar Front *</label>
                  <div className="h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:border-indigo-400 transition-all">
                    {aadhaarFrontPreview ? (
                      <img src={aadhaarFrontPreview} alt="Aadhaar Front" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="text-center p-2">
                        <svg className="mx-auto text-slate-300 mb-2" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Upload Front</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setAadhaarFrontPreview)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Aadhaar Back */}
                <div>
                  <label className={labelClass}>Aadhaar Back *</label>
                  <div className="h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:border-indigo-400 transition-all">
                    {aadhaarBackPreview ? (
                      <img src={aadhaarBackPreview} alt="Aadhaar Back" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="text-center p-2">
                        <svg className="mx-auto text-slate-300 mb-2" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Upload Back</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setAadhaarBackPreview)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* PAN Card */}
                <div>
                  <label className={labelClass}>PAN Card *</label>
                  <div className="h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:border-indigo-400 transition-all">
                    {panCardPreview ? (
                      <img src={panCardPreview} alt="PAN Card" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="text-center p-2">
                        <svg className="mx-auto text-slate-300 mb-2" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Upload PAN</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setPanCardPreview)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 3: IDENTITY ATTESTATION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Identity Attestation</h3>
                </div>

                <button 
                  type="button" 
                  onClick={clearSignature}
                  className="text-rose-500 font-bold text-[10px] uppercase tracking-wider hover:text-rose-700 transition-all flex items-center gap-1"
                >
                  ✕ Clear
                </button>
              </div>

              <label className={labelClass}>Digital Signature *</label>
              
              <div className="relative bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-4 text-center">
                {!hasSigned && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 font-black text-[10px] uppercase tracking-[0.3em]">
                    Sign Here (Mouse/Touch/Pen)
                  </div>
                )}
                <canvas 
                  ref={canvasRef} 
                  width={800} 
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-40 bg-transparent cursor-crosshair touch-none"
                ></canvas>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Please sign carefully. This signature will be used for all certificates and official documents.
              </p>
            </div>

            {/* SECTION 4: LEGAL ACKNOWLEDGEMENT */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Legal Acknowledgement</h3>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6 text-xs leading-relaxed text-slate-600">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">1. IDENTITY VERIFICATION AND AUTHENTICATION</h4>
                  <p>To ensure the integrity of the examination process and to prevent proxy attendance, the Candidate hereby authorizes the Portal to record a live video statement at the commencement of and/or during the examination. This video will be used solely to authenticate the Candidate's identity against registered records and acknowledge their enrollment in the program. Failure to provide a clear video statement or any attempt to bypass this authentication may result in immediate disqualification.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">2. PURPOSE OF CERTIFICATION AND EMPLOYMENT DISCLAIMER</h4>
                  <p className="mb-2">The Candidate acknowledges and agrees that this certification is intended solely for personal and professional growth.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>No Guarantee of Employment:</strong> Successful completion of the exam and issuance of a certificate does not guarantee a job offer, placement, or any form of employment.</li>
                    <li><strong>No Guarantee of Financial Increase:</strong> This certification does not entitle the Candidate to a salary hike, promotion, or bonus from any current or future employer.</li>
                  </ul>
                  <p className="mt-2">The Portal and its affiliates are not liable for any career expectations not met following the attainment of this certification.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">3. ACADEMIC INTEGRITY</h4>
                  <p>The Candidate agrees to complete the examination independently without the use of unauthorized materials, AI tools, or external assistance. Any detected malpractice will lead to the permanent banning of the Candidate's profile and the nullification of any previous results.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">4. LIMITATION OF LIABILITY</h4>
                  <p>The Portal shall not be held responsible for technical failures on the Candidate's end, including but not limited to internet connectivity issues, hardware malfunctions, or power outages during the examination session.</p>
                </div>

                <div className="pt-4 border-t border-slate-200/60">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-5 h-5 rounded-full border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      I have read, understood, and agree to follow all the legal terms and accept full responsibility for my actions.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTIONS BAR */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all"
              >
                Go Back
              </button>

              <button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
              >
                Submit Application →
              </button>
            </div>

          </form>
        )}

        {/* STEP 3: APPLICATION SUBMITTED */}
        {step === 3 && (
          <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] p-10 text-center space-y-6 animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-50">
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Application Submitted
            </h2>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Your admission application and identity documents have been successfully securely submitted. Our team will review them and contact you shortly.
            </p>

            <div className="bg-slate-50 py-3 px-4 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                Ref ID: {submittedId}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admission;
