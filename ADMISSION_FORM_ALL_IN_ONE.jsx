import React, { useState, useEffect, useRef } from 'react';

/**
 * ============================================================================
 * ALL-IN-ONE ADMISSION FORM COMPONENT WITH LIVE VIDEO STATEMENT & IDENTITY VERIFICATION
 * ============================================================================
 * 
 * REQUIRED SUPABASE SQL QUERIES (Copy and run in Supabase SQL Editor):
 * ----------------------------------------------------------------------------
 * CREATE TABLE IF NOT EXISTS public.admissions (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
 *   full_name text NOT NULL,
 *   email text NOT NULL,
 *   phone text NOT NULL,
 *   course_name text NOT NULL,
 *   pincode text,
 *   state text,
 *   city text,
 *   address text,
 *   aadhaar_front_url text,
 *   aadhaar_back_url text,
 *   pan_url text,
 *   signature_url text,
 *   profile_photo_url text,
 *   video_url text,
 *   ip_address text,
 *   status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
 *   remarks text
 * );
 * 
 * ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public insert admissions" ON public.admissions FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Public select admissions" ON public.admissions FOR SELECT USING (true);
 * CREATE POLICY "Public update admissions" ON public.admissions FOR UPDATE USING (true);
 * CREATE POLICY "Public delete admissions" ON public.admissions FOR DELETE USING (true);
 * 
 * INSERT INTO storage.buckets (id, name, public) VALUES ('admissions', 'admissions', true) ON CONFLICT (id) DO UPDATE SET public = true;
 * INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO UPDATE SET public = true;
 * INSERT INTO storage.buckets (id, name, public) VALUES ('aadhaar_cards', 'aadhaar_cards', true) ON CONFLICT (id) DO UPDATE SET public = true;
 * 
 * CREATE POLICY "Public Storage Select" ON storage.objects FOR SELECT USING (bucket_id IN ('admissions', 'aadhaar_cards', 'videos'));
 * CREATE POLICY "Public Storage Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('admissions', 'aadhaar_cards', 'videos'));
 * CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE USING (bucket_id IN ('admissions', 'aadhaar_cards', 'videos'));
 * CREATE POLICY "Public Storage Delete" ON storage.objects FOR DELETE USING (bucket_id IN ('admissions', 'aadhaar_cards', 'videos'));
 * ----------------------------------------------------------------------------
 * 
 * Features Included:
 * 1. Step 1: Candidate Basic Information (Name, Email, Phone, Course)
 * 2. Step 2: Location Auto-detection & Address Details
 * 3. Step 2: Live Camera Video Recording Statement (with Hindi & English Script)
 * 4. Step 2: Identity Documents Upload (Aadhaar Front/Back, PAN Card)
 * 5. Step 2: Digital HTML5 Signature Pad (Touch & Mouse Support)
 * 6. Step 2: Legal Terms Acknowledgement
 * 7. Automatic Supabase DB & Storage Uploads
 * 8. Backup Email Notification via Web3Forms API
 * 
 * How to use in any React Project:
 * <AdmissionFormAllInOne 
 *    supabase={supabaseClient} 
 *    portalName="Elite Toolistic"
 *    supportEmail="support@elitetoolistic.com"
 *    web3FormsKey="71d5ef87-88ee-4b57-9315-1340e1a9350e"
 *    onSuccess={(recordId) => console.log('Submitted ID:', recordId)} 
 * />
 */


const indianStates = [
  "Select State", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function AdmissionFormAllInOne({
  supabase = null,
  portalName = "Elite Toolistic",
  supportEmail = "support@elitetoolistic.com",
  web3FormsKey = "71d5ef87-88ee-4b57-9315-1340e1a9350e",
  onSuccess = null
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedId, setSubmittedId] = useState(null);

  // Active Script Language (English or Hindi)
  const [activeScriptLang, setActiveScriptLang] = useState('both'); // 'both', 'en', 'hi'

  // Step 1 Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [courseName, setCourseName] = useState('');

  // Step 2 Form Fields
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

  // Identity Documents Previews (Base64 or Blob URL)
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(null);
  const [panCardPreview, setPanCardPreview] = useState(null);

  // Signature Canvas
  const canvasRef = useRef(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Terms Acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);

  // User IP Address
  const [userIp, setUserIp] = useState('');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip || ''))
      .catch(() => setUserIp('Not captured'));
  }, []);

  // Location Auto-Detect Handler
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
      setErrorMsg('Camera and Microphone permissions are required to record your live video statement. Please allow permissions.');
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
        videoBitsPerSecond: 25000000 
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        
        // 500 MB Size Limit Check
        const maxSizeBytes = 500 * 1024 * 1024;
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

  // Signature Pad Handlers (Touch & Mouse Support)
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

  // File Upload Preview Handler
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

  // Storage Upload Helper
  const uploadAsset = async (fileOrBase64, filenamePrefix) => {
    if (!fileOrBase64) return '';

    if (supabase && supabase.storage) {
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
        console.warn('Supabase storage upload notice:', err);
      }
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
        video_url: photoUrl,
        ip_address: userIp || 'Not captured',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      let recordId = `ADM-${Date.now().toString().slice(-6)}`;

      // Save to Supabase DB if available
      if (supabase) {
        const { data, error } = await supabase
          .from('admissions')
          .insert([admissionRecord])
          .select();

        if (data && data[0]) recordId = data[0].id;
        if (error) console.warn('Supabase DB Notice:', error.message);
      }

      // Local storage backup
      const existingLocal = JSON.parse(localStorage.getItem('elitetoolistic_admissions') || '[]');
      existingLocal.unshift({ ...admissionRecord, id: recordId });
      localStorage.setItem('elitetoolistic_admissions', JSON.stringify(existingLocal));

      // Backup Email Notification via Web3Forms API
      if (web3FormsKey) {
        try {
          await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_key: web3FormsKey,
              subject: `NEW Admission Application — ${fullName}`,
              from_name: `${portalName} Admission Portal`,
              email: email,
              recipient: supportEmail,
              message: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMISSION APPLICATION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Application ID: ${recordId}
Full Name: ${fullName}
Email: ${email}
Phone: ${phone}
Course: ${courseName}
Location: ${cityName}, ${stateName} (${pincode})
Address: ${address}
IP Address: ${userIp || 'Not captured'}

DOCUMENTS:
• Video Statement: ${photoUrl || 'Recorded'}
• Aadhaar Front: ${frontUrl}
• Aadhaar Back: ${backUrl}
• PAN Card: ${panUrl}
• Signature: ${signUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
            })
          });
        } catch (e) {
          console.warn('Web3Forms Notice:', e);
        }
      }

      setSubmittedId(recordId);
      if (onSuccess) onSuccess(recordId);

    } catch (err) {
      console.error('Final Submit Error:', err);
      setErrorMsg(err.message || 'Failed to submit admission application. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Input styles
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2";

  if (submittedId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-white">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl font-black">
            ✓
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Application Submitted!</h2>
            <p className="text-slate-400 text-xs mt-2">Your admission details & live video verification have been received.</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400 block font-medium">Application Reference ID</span>
            <span className="font-mono text-indigo-400 font-bold text-base">{submittedId}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Our admissions team will verify your identity documents and video statement. You will receive an update via email ({email}).
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 font-sans text-slate-100 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white text-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-widest">
              OFFICIAL ADMISSION PORTAL
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{portalName} Admission Application</h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl">
              Complete the two-step verification form including candidate information, live video statement, identity documents, and digital signature.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-10 space-y-8">

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-4 border-b border-slate-100 pb-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>1</span>
              <span className="text-xs font-bold uppercase tracking-wider">Candidate Info</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
              <span className="text-xs font-bold uppercase tracking-wider">Video & Documents</span>
            </div>
          </div>

          {/* Global Error Banner */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-medium flex items-center justify-between animate-shake">
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-800 font-bold ml-4">✕</button>
            </div>
          )}

          {/* STEP 1: CANDIDATE INFORMATION */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                Step 1: Personal & Course Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Full Name (As per Govt ID) *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input 
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Mobile Number (10-digit) *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Course Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Master Professional Toolistic Training"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  Continue to Step 2 →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VIDEO RECORDING, LOCATION & DOCUMENTS */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-8 animate-fade-in">
              
              {/* SECTION 1: LIVE VIDEO STATEMENT CAMERA RECORDING */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <span>🎥</span> Step 2A: Live Video Verification Statement *
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Record a live video statement reading the required script below using your device camera.
                    </p>
                  </div>
                  
                  {/* Script Language Switcher Tabs */}
                  <div className="flex items-center bg-slate-200 p-1 rounded-xl text-xs font-bold">
                    <button 
                      type="button"
                      onClick={() => setActiveScriptLang('both')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${activeScriptLang === 'both' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
                    >
                      Both
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveScriptLang('en')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${activeScriptLang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
                    >
                      English
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveScriptLang('hi')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${activeScriptLang === 'hi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>

                {/* Camera / Video View Area */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-[360px] flex items-center justify-center border border-slate-800 shadow-inner">
                  
                  {/* Live Camera View */}
                  {isCameraActive && !recordedVideoUrl && (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                  )}

                  {/* Recorded Video Playback View */}
                  {recordedVideoUrl && (
                    <video src={recordedVideoUrl} controls className="w-full h-full object-contain bg-black"></video>
                  )}

                  {/* Camera Controls Overlay */}
                  {!recordedVideoUrl && isCameraActive && (
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
                      {!isRecording ? (
                        <button 
                          type="button" 
                          onClick={startRecording}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-full text-xs flex items-center gap-2 shadow-lg shadow-rose-600/40"
                        >
                          <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
                          Start Recording
                        </button>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="bg-rose-600/90 text-white text-xs font-mono font-bold px-4 py-2 rounded-full border border-rose-400/30 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                            REC {formatTimer(recordingTimer)}
                          </span>
                          <button 
                            type="button" 
                            onClick={stopRecording}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2 rounded-full text-xs border border-slate-700 shadow-lg"
                          >
                            Stop Recording
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Retake Action Bar */}
                  {recordedVideoUrl && (
                    <div className="absolute top-4 right-4 z-10">
                      <button 
                        type="button"
                        onClick={retakeVideo}
                        className="bg-slate-900/90 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs border border-slate-700 shadow-lg"
                      >
                        🔄 Retake Video
                      </button>
                    </div>
                  )}

                  {/* Camera Open Trigger */}
                  {!isCameraActive && !recordedVideoUrl && (
                    <div className="text-center p-6 space-y-3">
                      <button 
                        type="button"
                        onClick={startCamera}
                        className="w-14 h-14 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto text-2xl hover:scale-105 transition-all cursor-pointer"
                      >
                        📷
                      </button>
                      <p className="text-xs font-bold text-slate-300">Click to Open Camera & Microphone</p>
                    </div>
                  )}
                </div>

                {/* DUAL READ-ALOUD SCRIPT (ENGLISH & HINDI) */}
                <div className="space-y-4 pt-2">
                  
                  {(activeScriptLang === 'both' || activeScriptLang === 'en') && (
                    <div className="space-y-2">
                      <h5 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        READ ALOUD SCRIPT (ENGLISH):
                      </h5>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-700 text-xs leading-relaxed space-y-2 font-medium shadow-sm">
                        <p>
                          "My name is <strong className="text-indigo-700">{fullName || '[Candidate Name]'}</strong> and my registered email address is <strong className="text-indigo-700">{email || '[Candidate Email]'}</strong>. I voluntarily recorded this video statement to verify my profile, confirm my identity, and acknowledge my enrollment in {portalName}'s professional training program."
                        </p>
                        <p>
                          "I purchased this course for personal skill enhancement and professional development. I fully accept and understand that {portalName} is an educational course provider and does not guarantee job placement. I certify that I will not file any false chargebacks or distribute copyrighted materials."
                        </p>
                      </div>
                    </div>
                  )}

                  {(activeScriptLang === 'both' || activeScriptLang === 'hi') && (
                    <div className="space-y-2">
                      <h5 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        कृपया ज़ोर से पढ़ें (HINDI SCRIPT):
                      </h5>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-700 text-xs leading-relaxed space-y-2 font-medium shadow-sm">
                        <p>
                          "मेरा नाम <strong className="text-emerald-700">{fullName || '[Candidate Name]'}</strong> है और मेरा रजिस्टर्ड ईमेल <strong className="text-emerald-700">{email || '[Candidate Email]'}</strong> है। मैंने अपनी पहचान कन्फर्म करने और {portalName} में अपने एनरोलमेंट को स्वीकार करने के लिए स्वेच्छा से यह वीडियो रिकॉर्ड किया है।"
                        </p>
                        <p>
                          "मैंने यह कोर्स अपनी पर्सनल स्किल्स और करियर डेवलपमेंट के लिए खरीदा है। मैं समझता हूँ कि {portalName} केवल ट्रेनिंग प्रोवाइडर है और किसी नौकरी की गारंटी नहीं देता है।"
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* SECTION 2: LOCATION DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-slate-900 text-base">Step 2B: Residential Location</h4>
                  <button 
                    type="button" 
                    onClick={handleDetectLocation}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    📍 Detect Location
                  </button>
                </div>

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
                      placeholder="City Name"
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Residential Address</label>
                  <input 
                    type="text" 
                    placeholder="Flat / House No., Street, Locality"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* SECTION 3: IDENTITY DOCUMENTS UPLOAD */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3">Step 2C: Identity Documents</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Aadhaar Front */}
                  <div className="space-y-2">
                    <label className={labelClass}>Aadhaar Front Image *</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setAadhaarFrontPreview)}
                      className="text-xs w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {aadhaarFrontPreview && (
                      <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={aadhaarFrontPreview} alt="Aadhaar Front" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="space-y-2">
                    <label className={labelClass}>Aadhaar Back Image *</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setAadhaarBackPreview)}
                      className="text-xs w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {aadhaarBackPreview && (
                      <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={aadhaarBackPreview} alt="Aadhaar Back" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* PAN Card */}
                  <div className="space-y-2">
                    <label className={labelClass}>PAN Card Image *</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setPanCardPreview)}
                      className="text-xs w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {panCardPreview && (
                      <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={panCardPreview} alt="PAN Card" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* SECTION 4: DIGITAL SIGNATURE PAD */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className={labelClass}>Digital Signature *</label>
                  {hasSigned && (
                    <button 
                      type="button" 
                      onClick={clearSignature}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800"
                    >
                      Clear Signature
                    </button>
                  )}
                </div>

                <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50 relative">
                  <canvas 
                    ref={canvasRef}
                    width={700}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 bg-white cursor-crosshair touch-none"
                  ></canvas>
                  {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-bold uppercase tracking-wider opacity-60">
                      Sign Here Using Mouse or Touch Screen
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: LEGAL ACKNOWLEDGEMENT */}
              <label className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 cursor-pointer">
                <input 
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  I certify that all details, identity documents, digital signature, and live video statement submitted are genuine and belong to me. I agree to the terms and privacy policy of {portalName}.
                </span>
              </label>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl text-xs"
                >
                  ← Back to Step 1
                </button>

                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {loading ? (loadingMsg || 'Submitting...') : 'Complete & Submit Admission →'}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
