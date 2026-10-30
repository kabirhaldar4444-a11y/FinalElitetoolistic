import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

// Helper to robustly capture a real non-black frame from an HTMLVideoElement
const captureFrameFromVideoElement = async (videoEl) => {
  if (!videoEl) return null;

  const extract = () => {
    try {
      const width = videoEl.videoWidth;
      const height = videoEl.videoHeight;
      // Ensure video is actively decoding frames and has real dimensions
      if (!width || !height || videoEl.readyState < 2) {
        return null;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Mirror frame horizontally to match the mirrored selfie webcam preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.92);
      });
    } catch (err) {
      console.error('Failed to extract video frame:', err);
      return null;
    }
  };

  // 1. Try immediate extraction
  let blob = await extract();
  if (blob) return blob;

  // 2. If video frames are still initializing, poll every 250ms up to 8 times (~2s)
  for (let i = 0; i < 8; i++) {
    await new Promise((res) => setTimeout(res, 250));
    blob = await extract();
    if (blob) return blob;
  }
  return null;
};

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
  const [courseName, setCourseName] = useState('');

  // Step 2 Form Data
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('Select State');
  const [cityName, setCityName] = useState('');
  const [address, setAddress] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [pincodeSuccess, setPincodeSuccess] = useState('');

  // Step 2 Video Recording & Media
  const [videoStream, setVideoStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);

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
      .then(data => {
        const ip = data.ip || '';
        setUserIp(ip);
        if (ip) localStorage.setItem('candidate_kyc_ip', ip);
      })
      .catch(() => setUserIp('Not captured'));
  }, []);

  // Sync camera stream to the video element whenever camera becomes active or stream changes
  useEffect(() => {
    if (isCameraActive && videoStream && videoRef.current) {
      if (videoRef.current.srcObject !== videoStream) {
        videoRef.current.srcObject = videoStream;
      }
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Camera video play was intercepted or requires interaction:', err);
        });
      }
    }
  }, [isCameraActive, videoStream]);

  // Clean up media stream tracks when component unmounts
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [videoStream]);

  // Fetch State and City from Pincode using api.postalpincode.in
  const fetchAddressByPincode = async (pinValue) => {
    const cleanPin = pinValue.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) return;

    setIsFetchingPincode(true);
    setPincodeError('');
    setPincodeSuccess('');

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
      const data = await response.json();

      if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        const state = postOffice.State || '';
        const district = postOffice.District || postOffice.Name || '';

        // Match state accurately against indianStates
        if (state) {
          const matched = indianStates.find(s => s.toLowerCase() === state.trim().toLowerCase());
          if (matched) {
            setStateName(matched);
          } else {
            const partial = indianStates.find(s => 
              s.toLowerCase().includes(state.trim().toLowerCase()) || 
              state.trim().toLowerCase().includes(s.toLowerCase())
            );
            setStateName(partial || state.trim());
          }
        }

        if (district) {
          setCityName(district);
        }

        setPincodeSuccess(`Found: ${district ? `${district}, ` : ''}${state}`);
      } else {
        setPincodeError('Invalid PIN code or postal details not found.');
      }
    } catch (err) {
      console.error('Postal PIN API fetch error:', err);
      setPincodeError('Network error while fetching PIN code details.');
    } finally {
      setIsFetchingPincode(false);
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);
    setPincodeError('');
    setPincodeSuccess('');

    if (val.length === 6) {
      fetchAddressByPincode(val);
    }
  };

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
              if (data.postcode) {
                const pin = data.postcode.replace(/\D/g, '').slice(0, 6);
                setPincode(pin);
                if (pin.length === 6) {
                  fetchAddressByPincode(pin);
                }
              }
              if (data.principalSubdivision && (!stateName || stateName === 'Select State')) {
                const matched = indianStates.find(s => s.toLowerCase() === data.principalSubdivision.toLowerCase());
                if (matched) setStateName(matched);
              }
              if ((data.city || data.locality) && !cityName) {
                setCityName(data.city || data.locality);
              }
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
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });

      setVideoStream(stream);
      setIsCameraActive(true);

      // Immediately connect to video element if already in DOM
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Camera video play warning:', e));
      }
    } catch (err) {
      console.error('Camera/mic access error:', err);
      setIsCameraActive(false);
      setErrorMsg('Camera and Microphone permissions are required to record your live video statement. Please allow camera and mic access in your browser.');
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsCameraActive(false);
  };

  // Helper to capture profile photo from video stream
  const captureSnapshot = async () => {
    if (!videoRef.current) return null;
    const blob = await captureFrameFromVideoElement(videoRef.current);
    if (blob) {
      setCapturedPhotoBlob(blob);
      const url = URL.createObjectURL(blob);
      setCapturedPhotoUrl(url);
      return blob;
    }
    return null;
  };

  const startRecording = () => {
    if (!videoStream) return;
    recordedChunksRef.current = [];
    
    try {
      let mimeType = '';
      const candidateTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
        'video/mp4'
      ];
      for (const t of candidateTypes) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const recorderOptions = mimeType ? { mimeType } : {};
      try {
        mediaRecorderRef.current = new MediaRecorder(videoStream, {
          ...recorderOptions,
          videoBitsPerSecond: 2500000 // 2.5 Mbps crisp 720p/1080p stream
        });
      } catch (e) {
        mediaRecorderRef.current = new MediaRecorder(videoStream, recorderOptions);
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedType = mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: recordedType });
        
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
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);

      // Auto-capture clear profile photo snapshot after 1.5 seconds if not yet captured
      setTimeout(async () => {
        if (!capturedPhotoBlob && videoRef.current) {
          await captureSnapshot();
        }
      }, 1500);
    } catch (err) {
      console.error('Error starting video recording:', err);
      setErrorMsg('Failed to start video recording. Please ensure camera/mic permissions are enabled.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      // If photo snapshot was not captured yet, take it now before stopping video stream tracks
      if (!capturedPhotoBlob && videoRef.current) {
        await captureSnapshot();
      }
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
    setCapturedPhotoBlob(null);
    setCapturedPhotoUrl(null);
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
    if (!capturedPhotoBlob) return setErrorMsg('Please wait for the photo capture to complete during recording.');
    if (!aadhaarFrontPreview) return setErrorMsg('Please upload your Aadhaar Card (Front) image.');
    if (!aadhaarBackPreview) return setErrorMsg('Please upload your Aadhaar Card (Back) image.');
    if (!panCardPreview) return setErrorMsg('Please upload your PAN Card image.');
    if (!signatureData) return setErrorMsg('Please draw your digital signature on the signature pad.');
    if (!termsAccepted) return setErrorMsg('Please check the legal terms acknowledgement box to proceed.');

    setLoading(true);
    setLoadingMsg('Processing documents & saving application...');

    try {
      const [photoUrl, videoUrl, frontUrl, backUrl, panUrl, signUrl] = await Promise.all([
        uploadAsset(capturedPhotoBlob, 'profile_photo'),
        uploadAsset(recordedVideoBlob, 'profile_video'),
        uploadAsset(aadhaarFrontPreview, 'aadhaar_front'),
        uploadAsset(aadhaarBackPreview, 'aadhaar_back'),
        uploadAsset(panCardPreview, 'pan_card'),
        uploadAsset(signatureData, 'signature')
      ]);

      const admissionRecord = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: '',
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
        video_url: videoUrl,
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
            subject: `Admission Form Submitted — ${fullName}`,
            from_name: "Elitetoolistic Exam Portal",
            email: email,
            recipient: "support@elitetoolistic.com",
            message: `----------------------------------------
ADMISSION VERIFICATION REPORT
----------------------------------------

APPLICATION & CANDIDATE DETAILS:
--------------------------------
• Application Reference ID: ${recordId}
• Application Status: Pending Admin Approval
• Full Name: ${fullName}
• Email ID: ${email}
${courseName ? `• Course Applied: ${courseName}\n` : ''}• PIN Code: ${pincode}
• Location: ${cityName}, ${stateName}
• Residential Address: ${address || 'N/A'}
• IP Address: ${userIp || 'Not captured'}

VERIFICATION STATUS:
-------------------
• Declaration: CHECKED & ACCEPTED ✓
• Signature: CAPTURED & VERIFIED ✓
• Documentation: ALL ASSETS UPLOADED ✓

LEGAL ACKNOWLEDGEMENT & ATTESTATION:
----------------------------------
1. IDENTITY VERIFICATION:
Candidate authorizes live photo capture for identity
authentication and anti-proxy measures.

2. EMPLOYMENT DISCLAIMER:
Candidate acknowledges certification does not guarantee
employment, placement, or financial increases.

3. ACADEMIC INTEGRITY:
Candidate agrees to complete exams independently
without unauthorized materials or AI assistance.

4. LIMITATION OF LIABILITY:
Portal is not liable for technical failures or candidate-side
connectivity issues during examinations.

FINAL DECLARATION & FULL AGREEMENT:
----------------------------------
SERVICE DELIVERY:
🔎 Step 1: Immediate Admission Confirmation After Payment
The student onboarding journey begins instantly upon checkout. As
soon as a transaction clears our secure platform gateways, our
backend servers trigger an Automated Admission Confirmation Notice.
Students receive an digital welcome package containing their
permanent user profile IDs, platform workspace access routes, and an
overview map of their target educational tracks.

📌 Step 2: Mandatory Document KYC Verification
In strict compliance with structural risk management policies, all
enrolled learners must verify their commercial profile data. Students
are required to securely upload their valid identity documentation
(such as government-issued photo IDs or institutional cards) to our
encrypted verification portal. This step ensures that final completion
documentation matches legal corporate profiles accurately.

🔎 Step 3: Secure Video KYC Authentication
To prevent platform identity theft, proxy testing, and transaction
chargeback vectors, students must execute an automated Video KYC
Verification step. Using an integrated web interface, learners record a
brief, self-directed biometric identity check matching their uploaded
documents. This establishes an unalterable audit trail for security
purposes.

📊 Step 4: System Generation & Delivery of GST Invoice
Accountability and fiscal transparency are foundational to our services.
Within 24 hours of successful verification, our accounting systems
compile a comprehensive, legally compliant Corporate GST Invoice
detailing the exact service breakdown and tax identifiers. This asset is
dispatched straight to the student’s billing tab for corporate tax
deduction filing purposes.

📄 Step 5: Dissemination of Comprehensive PDF Study Material (Strict
One-Time Release)
Upon successful verification, the complete independent text registry
library is unlocked. Students receive high-fidelity, comprehensive PDF
Study Materials and Text Workbooks tailored strictly to their
curriculum.
⚠️ Operational Security Notice: In accordance with our digital asset
protection protocols, all reading materials are shared on a strict one-time basis only. Students must securely download and save these
assets immediately upon distribution, as link refreshes or secondary
file dispatches will not be granted.

🌟 Step 6: Issuance of Formal Training Enrollment Certificate
Before course modules begin, our records registry generates a formal,
verifiable Elitetoolistic Enrollment Certificate. This initial credential
serves as an active commercial proof of status, reflecting that the
individual is currently under training within an active, non-affiliated skill
development boot camp.

📈 Step 7: Access Provisioning for Video Lecture Sessions (Strict One-Time Release)
Learners gain access to their master collection of high-definition, pre-recorded visual walkthroughs and technical screen-shares. These
professional Video Lectures contain the entirety of the execution-level
core methodologies.
⚠️ Operational Security Notice: In line with platform distribution rules,
access keys to the video lecture sets are shared on a strict one-time
basis only. Re-sharing, profile splitting, or secondary video deliveries
are completely restricted to safeguard content parameters.

🗝️ Step 8: Distribution of Final Examination Login Credentials
Once the 10-day, 20-day, or 30-day curriculum timeline has elapsed,
the student workspace triggers the final evaluation phase. The
platform outputs unique, encrypted Final Exam Login Credentials
directly to the student portal, giving them an isolated access window
to complete their timed, multiple-choice evaluation independently.

✅ Step 9: Final Exam Result Processing & Delivery with Provisional
Certificate (PC)
Upon completing the examination, our grading engines parse the
submission data against metric matrices. The comprehensive Final
Exam Result Sheet is computed and displayed instantly inside the
dashboard. Graduates are immediately issued their verified Provisional
Certificate (PC), closing out the service lifecycle and enabling
immediate skill deployment in the corporate sector.

TERMS & CONDITIONS:
📜 TERMS AND CONDITIONS UPDATE: SERVICE FULFILLMENT & NO-REFUND POLICY
1. Scope of Independent Vocational Services
By completing a commercial transaction and registering for any
training program on Elitetoolistic (https://elitetoolistic.com), the user
(hereinafter referred to as the "Student" or "Client") explicitly
acknowledges and agrees that all services rendered are independent,
skill-based vocational training programs.
Elitetoolistic functions strictly as an asynchronous educational
infrastructure platform. Our programs are non-degree, non-diploma
courses and explicitly do not require or maintain any affiliation,
accreditation, or licensing from any university, government institute, or
private educational board. Elitetoolistic grants institutional
"Certificates of Completion" and "Provisional Certificates" based
solely on independent competency assessments.

2. Asynchronous Delivery Model & Anti-Interactive Clauses
The Client explicitly understands and accepts that Elitetoolistic
operates on a static digital distribution model:
Exclusivity of Medium: Training is delivered solely and exclusively via
pre-recorded, asynchronous video lecture modules and downloadable
PDF text study workbooks.
Prohibition of Live Training: Elitetoolistic never offers, promises, or
provides any person-to-person instruction, live classroom training,
group webinars, real-time mentorship, or interactive tutor sessions.
Self-Directed Operational Responsibility: The Student bears absolute
responsibility for navigating the course materials independently within
the platform’s self-contained hosting framework. No claims for refunds
based on the lack of live human interaction will be entertained under
any circumstances, as the platform explicitly disclaims interactive
training.

3. Strict 9-Step Service Delivery Protocol & Binding Benchmarks
Fulfillment of the purchase contract is systematically tracked and
verified by our backend architecture across nine sequential milestones.
By enrolling, the Student agrees to comply with the operational
conditions of each step:
Admission Confirmation After Payment: Triggered instantly upon
payment gateway clearance. This marks the commencement of the
digital contractual relationship.
Mandatory Document KYC: The Student must securely upload valid
government-issued photo identification to verify their profile. Failure to
provide legitimate documentation within the course timeframe will
result in account suspension without a refund.
Mandatory Video KYC Authentication: A biometric video check must
be recorded by the student to verify identity, eliminate fraud, and
prevent proxy test-taking. Accounts failing the security profile checks
are immediately locked to preserve system integrity.
GST Invoice Delivery: A legally compliant Corporate GST Invoice is
compiled and posted to the student's dashboard within 24 hours of
successful validation.
PDF Study Material Dissemination (Strict One-Time Release Clauses):
Comprehensive text materials are unlocked inside the student portal.
The Client acknowledges that files are shared on a strict one-time
basis only. The Student bears the full legal and technical responsibility
to securely save, download, and backup these digital assets
immediately upon distribution. Elitetoolistic completely denies any
liability for file loss, hardware failure, or requests for link refreshes
post-distribution.
Enrollment Certificate Issuance: A digital record reflecting that the
individual is actively under training within our independent boot camp
is instantly generated and delivered.
Video Lecture Access Provisioning (Strict One-Time Release Clauses):
Pre-recorded training paths are made accessible to the profile
workspace.
Like the text files, access keys to the video streams are delivered on a
strict one-time basis only. Account sharing, profile splitting, or data
scraping are prohibited and will trigger automated account bans
without a refund.
Final Examination Login Credentials: Upon expiration of the designated
course duration (10, 20, or 30 days maximum), encrypted examination
keys are assigned to the portal.
Final Exam Grading & Provisional Certificate (PC) Delivery: Upon
submission, grading engines compute results instantly, and a
provisional credential is issued to close the service loop.

4. Defatigability of Services & Definitive "No-Refund" Policy
Elitetoolistic distributes high-value, proprietary digital intellectual
property. Due to the digital nature of these assets—which can be
instantly viewed, saved, or downloaded upon release—all transactions
executed on https://elitetoolistic.com are strictly FINAL, NON-CANCELLABLE, AND NON-REFUNDABLE.

[POLICY PROVISION TABLE]
--------------------------------------------------------------------------------------------------------
| POLICY PROVISION | DESCRIPTION & EXECUTION THRESHOLD | LEGAL IMPACT ON CLIENT |
| :--- | :--- | :--- |
| Instant Fulfillment Waiver | Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). | The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed. |
| One-Time Sharing Indemnification | Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. | The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules. |
| KYC Refusal Forfeiture | Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). | The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs. |
| Dispute & Chargeback Mitigation | Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. | Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim. |
--------------------------------------------------------------------------------------------------------

• Instant Fulfillment Waiver: Triggered immediately upon Step 1
(Payment Clearance) and Step 5 (PDF Study Material Dissemination).
The Client explicitly waives any right to an operational "cooling-off
period" or transaction cancellation once assets are deployed.
• One-Time Sharing Indemnification: Established upon execution of the
"Strict One-Time Release" protocols in Step 5 and Step 7. The platform
is completely indemnified against student complaints regarding data
loss, user error, device incompatibility, or platform lockouts resulting
from a breach of user rules.
• KYC Refusal Forfeiture: Triggered if a user refuses or fails Step 2
(Document KYC) or Step 3 (Video KYC). The user's account will be
permanently banned for a security breach. All paid registration fees are
entirely forfeited to cover administrative processing costs.
• Dispute & Chargeback Mitigation: Triggered when a client files a
dispute, credit card chargeback, or payment reversal claim. Treated
legally as a breach of contract. The platform will submit this policy and
server logs to banks to aggressively deny the claim.

5. Acceptance of Terms
By scrolling past this screen, clicking "I Agree," or processing a training
fee payment on our network domains, you explicitly declare that you
have read, understood, and agreed to be legally bound by this Service
Delivery Framework and No-Refund Policy. If you do not accept these
asynchronous, un-affiliated delivery constraints, you must exit our
platform immediately and refrain from purchasing any services.

PRIVACY POLICY:
1. Introduction & Scope
This Privacy Policy governs the data collection, storage, processing,
and security practices of Elitetoolistic (operating through its
asynchronous educational infrastructure platform at
https://elitetoolistic.com).
To deliver independent vocational training programs, identity
verification services, and verifiable institutional credentials, Elitetoolistic
must handle specific personal and biometric data. By registering an
account, making a purchase, or completing the security verification
steps, you explicitly consent to the collection, processing, and retention
practices outlined in this policy.

2. Information We Collect
Elitetoolistic processes information through various stages of your
onboarding, verification, and educational journey:
A. Personal Identification Data
Registration & Contact Information: Full legal name, billing address,
phone number, and corporate email address collected during checkout
or sign-up.
Fiscal Identity: Information required to generate corporate accounts,
including corporate entity names and specific tax identifiers.
B. Mandatory KYC & Security Verification Data
Documentary Identity (Document KYC): Images or digital files of valid
government-issued photo identification cards or institutional credential
badges uploaded securely to our portal.
Biometric Identity (Video KYC): Self-directed, brief video records
processed through an integrated web interface to execute facial
matching against submitted documentation and to eliminate proxy
testing.
C. Academic & Technical Workspace Logs
Evaluation Records: Answers, responses, submission timestamps, and
performance metrics parsed by our grading matrices during
automated final examinations.
System & Backend Server Logs: Unique workspace access keys,
internet protocol (IP) address mapping, browser data, and precise file-download timestamps related to the release of text libraries and video
lecture elements.

3. How We Use Your Data
Your information is processed strictly to maintain platform safety and
complete the structural service loop:
Identity Verification & Anti-Fraud: Cross-referencing your biometric
Video KYC data with your submitted physical document profile to
establish an unalterable audit trail, eliminating proxy test-taking and
financial transaction theft.
Service Fulfillment: Provisioning individual profiles with unique access
keys to streaming lecture workspaces, digital text repositories, and
encrypted final examination modules.
Credential Issuance: Generating accurate legal profiles for formal,
verifiable documents, including initial Enrollment Certificates and final
Provisional Certificates (PC).
Compliance & Legal Accountability: Compiling and posting legally
compliant Corporate GST Invoices straight to your workspace within
24 hours of successful validation.

4. Data Protection, Sharing, and Disclosure
A. Strict Third-Party Restrictions
Elitetoolistic treats proprietary and personal data with high security.
We do not sell, rent, trade, or share your personal, documentary, or
biometric data with external third-party marketing networks or
unrelated data brokers.
B. Conditional Sharing Framework
Data is shared exclusively under the following strict conditions:
Payment Processing: Financial details are managed securely via
encrypted, external payment gateways during checkout to clear
transactions safely.
Dispute and Chargeback Defense: In alignment with our Terms and
Conditions, if a user files a transaction dispute, credit card
chargeback, or payment reversal claim, Elitetoolistic will submit
backend server logs (such as download metrics and KYC verification
markers) to the involved financial institutions to defend against the
claim.
Legal Enforcement: Data may be disclosed if required by an official
court order, applicable government statutory body, or prevailing
regulatory legal framework.

5. Security & Technical Safeguards
We implement a multi-layered security infrastructure to shield your
files and identity profiles:
Data Encryption: Document uploads, video files, and financial invoice
generation are processed and stored over secure, encrypted network
connections.
Workspace Automated Bans: Automated behavioral system
parameters track multi-location concurrent logins. Profiles attempting
unauthorized concurrent access, scraping attempts via scripts, or
distributing video access streams are banned to ensure ecosystem
security.

6. Data Retention Policies
Operational Files: Personal profile structures, exam transcripts, and
credential verification links are kept for as long as your workspace
account remains active or to fulfill tax, corporate accounting, or
institutional tracking standards.
KYC Security Profiles: Biometric checks and government identification
logs are preserved securely to maintain an unalterable transaction
audit trail, serving as definitive evidence of contractual compliance.

7. Acceptance & Acknowledgement
Interacting with the platform, completing registrations, or inputting
identity vectors implies explicit and dynamic acknowledgement of this
Privacy Policy. If you do not accept these data handling rules, you must
immediately halt data submission and exit the platform.

REFUND POLICY:
1. Executive Summary & Legal Framework of Services
By completing a commercial financial transaction, processing a
payment gateway fee, or registering for any independent skill-based
training program on the Elitetoolistic network domains, the user
(hereinafter legally referred to as the "Student", "Client", or "User")
explicitly acknowledges, understands, and binds themselves to this
comprehensive, non-negotiable Service Fulfillment and No-Refund
Policy.
Elitetoolistic functions strictly and exclusively as an independent,
asynchronous educational infrastructure platform. The digital training
pathways, core methodologies, and instructional material hosted on
the platform are structured solely as non-degree, non-diploma
vocational training programs aimed at execution-level corporate skill
development.
Independent Status Notice:
The Client explicitly recognizes that Elitetoolistic does not maintain,
require, or claim any affiliation, accreditation, licensing, or oversight
from any university, government institute, statutory educational body,
or private educational board. All institutional credentials, including
"Certificates of Completion" and "Provisional Certificates (PC)", are
granted based entirely on independent competency assessments
managed internally by the platform’s grading matrices. Consequently,
normal academic withdrawal policies, student tuition protection
schemes, or traditional institutional refund metrics are wholly
inapplicable to transactions executed with this platform.

2. Asynchronous Delivery Model & Anti-Interactive Clauses
A fundamental pillar of this refund policy is the nature of the service
delivery itself. Elitetoolistic operates on a static digital distribution
model. The commercial valuation of the program is tied directly to the
ingestion of proprietary digital intellectual property rather than live
human instruction.
Exclusivity of Medium:
All vocational training curricula are delivered solely and exclusively via
pre-recorded, asynchronous video lecture modules and downloadable
PDF text study workbooks.
Prohibition of Live Training:
The platform never offers, promises, schedules, or provides any form
of person-to-person instruction, live virtual classroom training,
synchronous group webinars, real-time mentorship, or interactive
tutor-led question-and-answer sessions.
Self-Directed Operational Responsibility:
The Student bears absolute, sole, and un-delegable responsibility for
independently navigating, reading, viewing, and completing the course
materials within the platform’s self-contained hosting framework.
BINDING CLAUSE: No claims, complaints, demands, or legal petitions
for refunds based on a purported lack of live human interaction, lack of
custom feedback, or dissatisfaction with the self-guided nature of the
platform will be entertained under any circumstances. The platform
explicitly disclaims interactive training prior to purchase, and
registration constitutes a complete waiver of claims regarding
structural isolation during the learning process.

3. The Strict 9-Step Service Delivery Protocol
Fulfillment of the digital purchase contract is systematically tracked,
timestamped, and verified by the platform's automated backend server
log database. Contractual execution is broken down into nine
sequential milestones. By enrolling, the Student agrees that the
completion of these milestones constitutes definitive operational
execution of the service loop:
[Step 1: Payment & Instant Admission] ➡️ [Step 2: Document KYC] ➡️
[Step 3: Biometric Video KYC]
⬇️
[Step 6: Enrollment Certificate] ⬅️ [Step 5: One-Time PDF Release] ⬅️
[Step 4: Corporate GST Invoice]
⬇
[Step 7: One-Time Video Release] ➡️ [Step 8: Exam Key Distribution]
➡️ [Step 9: Grading & Provisional Cert]

Step 1: Immediate Admission Confirmation After Payment
This step is triggered instantly upon payment gateway clearance. As
soon as the transaction clears, our backend architecture outputs an
Automated Admission Confirmation Notice containing permanent user
profile IDs, platform workspace access routes, and an educational
track overview map. This instantaneous action marks the official
commencement of the binding digital contractual relationship.

Step 2: Mandatory Document KYC Verification
In strict compliance with commercial risk management, students are
required to securely upload valid government-issued photo
identification to our encrypted verification portal. This ensures final
documentation matches legal corporate profiles. Failure to upload
legitimate documentation within the selected course timeframe results
in account suspension without refund eligibility.

Step 3: Secure Video KYC Authentication
To prevent identity theft, proxy test-taking, and transaction
chargeback vectors, students must execute an automated, self-directed biometric identity check via an integrated web interface.
Accounts failing or refusing this profile check are immediately locked
to preserve system integrity, causing immediate forfeiture of fees.

Step 4: System Generation & Delivery of GST Invoice
Accountability and fiscal transparency are verified through the
automated compilation of a legally compliant Corporate GST Invoice
detailing the exact service breakdown and tax identifiers. This asset is
dispatched straight to the student’s billing tab within 24 hours of
validation for corporate tax deduction purposes.

Step 5: Dissemination of Comprehensive PDF Study Material (Strict
One-Time Release)
Upon successful validation, the comprehensive text registry library is
unlocked, allowing the student to view high-fidelity PDF Study
Materials and Text Workbooks.
The One-Time Release Clause: Files are shared on a strict one-time
basis only. The Student bears full legal and technical responsibility to
securely save, download, and backup these digital assets immediately
upon distribution. Elitetoolistic completely denies any liability for file
loss, hardware failure, or requests for link refreshes post-distribution.

Step 6: Issuance of Formal Training Enrollment Certificate
The records registry automatically generates a formal, verifiable
Elitetoolistic Enrollment Certificate. Delivered straight to the portal
dashboard, this initial credential serves as active commercial proof of
status, reflecting that the individual is currently under training within an
active, non-affiliated skill development boot camp.

Step 7: Access Provisioning for Video Lecture Sessions (Strict One-Time Release)
The student profile is provisioned with access keys to the master
collection of pre-recorded visual walkthroughs and technical screen-shares containing execution-level core methodologies.
The One-Time Video Stream Clause: Like the text files, access keys to
the video streams are delivered on a strict one-time basis only.
Account sharing, profile splitting, or data scraping are prohibited and
will trigger automated account bans without a refund.

Step 8: Distribution of Final Examination Login Credentials
Upon the expiration of the designated course duration matrix (10, 20,
or 30 days maximum), the student workspace automatically triggers
the evaluation phase by outputting unique, encrypted Final Exam Login
Credentials directly to the student portal. This provides an isolated
access window to complete the timed, multiple-choice evaluation
independently.

Step 9: Final Exam Result Processing & Delivery with Provisional
Certificate (PC)
Upon submission, grading engines parse the submission data against
metric matrices instantly. The comprehensive Final Exam Result Sheet
is computed and displayed inside the dashboard, and graduates are
immediately issued their verified Provisional Certificate (PC), closing
out the service lifecycle.

4. Defatigability of Services & Definitive "No-Refund" Core Policy
Elitetoolistic distributes high-value, proprietary digital intellectual
property. Due to the digital nature of these assets—which can be
instantly viewed, saved, cached, screenshotted, or downloaded
immediately upon release—all transactions executed on
https://elitetoolistic.com are strictly FINAL, NON-CANCELLABLE, AND
NON-REFUNDABLE.

[POLICY PROVISION TABLE]
--------------------------------------------------------------------------------------------------------
| POLICY PROVISION | DESCRIPTION & EXECUTION THRESHOLD | LEGAL IMPACT ON CLIENT |
| :--- | :--- | :--- |
| Instant Fulfillment Waiver | Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). | The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed. |
| One-Time Sharing Indemnification | Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. | The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules. |
| KYC Refusal Forfeiture | Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). | The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs. |
| Dispute & Chargeback Mitigation | Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. | Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim. |
--------------------------------------------------------------------------------------------------------

• Instant Fulfillment Waiver: Triggered immediately upon Step 1
(Payment Clearance) and Step 5 (PDF Study Material Dissemination).
The Client explicitly waives any right to an operational "cooling-off
period" or transaction cancellation once assets are deployed.
• One-Time Sharing Indemnification: Established upon execution of the
"Strict One-Time Release" protocols in Step 5 and Step 7. The platform
is completely indemnified against student complaints regarding data
loss, user error, device incompatibility, or platform lockouts resulting
from a breach of user rules.
• KYC Refusal Forfeiture: Triggered if a user refuses or fails Step 2
(Document KYC) or Step 3 (Video KYC). The user's account will be
permanently banned for a security breach. All paid registration fees are
entirely forfeited to cover administrative processing costs.
• Dispute & Chargeback Mitigation: Triggered when a client files a
dispute, credit card chargeback, or payment reversal claim. Treated
legally as a breach of contract. The platform will submit this policy and
server logs to banks to aggressively deny the claim.

5. Exhaustive Legal Provisos & Operational Enforcement
A. Technical Incompatibility & Device Disclaimers
The platform distributes standardized PDF formats and encrypted
video stream wrappers. It is the sole technical responsibility of the
Client to ensure that their personal hardware devices (desktop, laptop,
mobile, or tablet), operating systems, and internet service providers
meet the baseline operational requirements needed to stream video
data and open PDF document repositories. No refunds will be granted
based on technical limitations, outdated user browsers, local firewall
blocks, network latency, ISP restrictions, or general device
incompatibility.

B. Unilateral Account Revocation for Security Violations
Elitetoolistic maintains strict automated behavioral tracking
parameters across its workspace dashboards. The platform reserves
the right to terminate any user profile instantly, without warning, and
without the obligation of financial reimbursement or refund, if the
backend system logs detect any of the following unauthorized
activities:
- Concurrent multi-location IP logins indicating profile sharing or
account splitting.
- Attempted injection of automated data-scraping scripts, download
managers, or unauthorized stream-ripping software designed to
duplicate proprietary video lectures.
- The uploading of corrupted data packages, malware, or fraudulent
identity documentation during Step 2 (Document KYC) or Step 3
(Video KYC) protocols.

C. Program Modification and Discontinuance Indemnity
Elitetoolistic reserves the right to modify, adjust, update, or re-sequence any portion of its pre-recorded instructional modules, PDF
workbooks, grading metrics, or exam platforms at any time to preserve
current corporate relevance. The execution of a curriculum update
does not entitle the Client to a retrofitted refund, platform credit, or
course exchange.

6. Acceptance of Terms & Dynamic Acknowledgement
By scrolling past presentation screens, checking an "I Agree"
checkbox, interacting with any workspace element, or processing a
training fee payment on our network domains, you explicitly declare
that you have read, understood, and agreed to be legally bound by this
Service Delivery Framework and No-Refund Policy.
If you do not accept these asynchronous, un-affiliated delivery
constraints, or if you maintain any reservation regarding the definitive
finality of commercial transactions executed on this domain, you must
exit our platform immediately and refrain from purchasing any
services.

ACCEPTED BY CANDIDATE: YES ✓
----------------------------------------
SUPPORTING EVIDENCE:
---------------------
• IP Address: ${userIp || 'Not captured'}
• Candidate Profile Photo:
${photoUrl || 'N/A'}
• Live Video Statement:
${videoUrl || 'N/A'}
• Aadhaar Card (Front):
${frontUrl || 'N/A'}
• Aadhaar Card (Back):
${backUrl || 'N/A'}
• PAN Card:
${panUrl || 'N/A'}
• Digital Signature:
${signUrl || 'N/A'}

By proceeding, the candidate electronically signs and agrees to all
terms above.
----------------------------------------
Submitted via Elitetoolistic Exam Portal`
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

      {/* Floating Top-Left Back to Login Button */}
      <Link
        to="/login"
        id="admission-fixed-back-btn"
        className="fixed top-5 left-5 z-50 group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md hover:shadow-lg text-slate-700 hover:text-indigo-600 font-bold text-xs transition-all duration-300 hover:-translate-x-0.5"
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          className="transition-transform group-hover:-translate-x-1"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Back to Login</span>
      </Link>

      <div className="relative z-10 w-full flex flex-col items-center">

        {/* Top Secondary Navigation Bar (For Step 2) */}
        {step === 2 && (
          <div className="w-full max-w-5xl mx-auto pt-2 pb-2 px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              id="admission-top-back-step1-btn"
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md text-slate-600 hover:text-indigo-600 font-bold text-xs transition-all duration-300"
            >
              <span>← Edit Step 1</span>
            </button>
            <Link
              to="/login"
              className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}

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
            <div className="pt-2 space-y-3">
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-black text-[10px] py-4 rounded-2xl uppercase tracking-[0.3em] transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95"
              >
                Proceed to Verification
              </button>

              {/* Return to Login Card (matches Login.jsx style) */}
              <div className="pt-2 text-center">
                <Link 
                  to="/login" 
                  id="admission-card-back-login"
                  className="group flex items-center justify-between gap-3 w-full py-3.5 px-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/40 hover:from-indigo-100/80 hover:to-purple-100/60 text-indigo-900 font-bold text-xs tracking-wide transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-sm">
                      🔑
                    </span>
                    <div className="text-left">
                      <span className="block text-[11px] font-black uppercase tracking-wider text-indigo-950">Already Registered?</span>
                      <span className="block text-[10px] font-semibold text-indigo-600">Back to Login & Exam Portal</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 font-bold">
                    <span className="text-[10px] uppercase tracking-wider">Login</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </Link>
              </div>
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
                      <video 
                        ref={(el) => {
                          videoRef.current = el;
                          if (el && videoStream && el.srcObject !== videoStream) {
                            el.srcObject = videoStream;
                            el.play().catch(() => {});
                          }
                        }} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover scale-x-[-1]"
                        onLoadedMetadata={(e) => {
                          e.target.play().catch(() => {});
                        }}
                      />
                      
                      {isRecording && (
                        <div className="absolute top-4 left-4 bg-rose-600/90 text-white font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-2 animate-pulse shadow-lg backdrop-blur-md">
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                          REC {formatTimer(recordingTimer)}
                        </div>
                      )}

                      {capturedPhotoUrl && (
                        <div className="absolute top-4 right-4 bg-emerald-600/90 text-white font-bold text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          Photo Captured
                        </div>
                      )}

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 w-max">
                        {!isRecording ? (
                          <>
                            <button 
                              type="button" 
                              onClick={startRecording} 
                              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest px-6 py-2.5 rounded-full shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <span className="w-3 h-3 rounded-full bg-white"></span>
                              Start Recording
                            </button>
                            <button
                              type="button"
                              onClick={captureSnapshot}
                              title="Capture profile picture snapshot"
                              className="bg-white/90 hover:bg-white text-slate-800 font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.039l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg>
                              Snap Photo
                            </button>
                          </>
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
                    <div className="flex flex-col items-center gap-4 w-full max-w-md">
                      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950">
                        <video src={recordedVideoUrl} controls className="w-full h-64 object-cover rounded-3xl"></video>
                      </div>
                      
                      {capturedPhotoUrl && (
                        <div className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full animate-fade-in">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Captured Profile Photo</span>
                          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md bg-white">
                            <img src={capturedPhotoUrl} alt="Profile Photo" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-white border border-slate-100 rounded-2xl w-full flex justify-center">
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
                        "My name is <strong>{fullName || '[Candidate Name]'}</strong>, and my registered email address is <strong>{email || '[Candidate Email]'}</strong>. I purposely recorded this video statement to verify my profile, confirm my identity, and acknowledge my enrollment in Elite Toolistic's professional training program (available at https://elitetoolistic.com/)."
                      </p>
                      <p>
                        "I purchased this service directly from the Elite Toolistic website after conducting a Google search; no third-party company or agency provided me with assistance or recommendations to take these services."
                      </p>
                      <p>
                        "I am purchasing this course for personal skill enhancement, professional development, and career growth. I fully accept and understand that Elite Toolistic is only an educational skills-based course training provider and never offers a job promise, job placement assurance, or particular career assurances upon course completion."
                      </p>
                      <p>
                        "Furthermore, I am aware and fully understand that the amount I paid to Elite Toolistic is non-refundable. I also certify that I am completely satisfied with the Elite Toolistic-provided support and services (support@elitetoolistic.com). I also promise not to share or distribute any copyrighted course materials supplied to me throughout this program. This statement is made freely, knowingly, and without pressure."
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
                        "मेरा नाम <strong>{fullName || '[Candidate Name]'}</strong> है और मेरा रजिस्टर्ड ईमेल एड्रेस <strong>{email || '[Candidate Email]'}</strong> है। मैंने अपनी प्रोफाइल को वेरीफाई करने, अपनी पहचान कन्फर्म करने और Elite Toolistic के प्रोफेशनल ट्रेनिंग प्रोग्राम (जो https://elitetoolistic.com/ पर उपलब्ध है) में अपने एनरोलमेंट को स्वीकार करने के लिए यह वीडियो स्टेटमेंट रिकॉर्ड किया है।"
                      </p>
                      <p>
                        "मैंने यह सर्विस गूगल सर्च करने के बाद सीधे Elite Toolistic की वेबसाइट से खरीदी है; किसी भी थर्ड-पार्टी कंपनी या एजेंसी ने मुझे यह सर्विस लेने के लिए कोई सहायता या सिफारिश प्रदान नहीं की है।"
                      </p>
                      <p>
                        "मैं यह कोर्स अपनी पर्सनल स्किल्स को बेहतर बनाने, प्रोफेशनल डेवलपमेंट और करियर ग्रोथ के लिए खरीद रहा हूँ। मैं पूरी तरह से स्वीकार करता हूँ और समझता हूँ कि Elite Toolistic केवल एक एजुकेशनल स्किल-बेस्ड कोर्स ट्रेनिंग प्रोवाइडर है और कोर्स पूरा होने पर कभी भी नौकरी का वादा, नौकरी मिलने की गारंटी या किसी खास करियर की गारंटी नहीं देता है।"
                      </p>
                      <p>
                        "इसके अलावा, मैं पूरी तरह से समझता हूँ और जानता हूँ कि Elite Toolistic को मेरे द्वारा भुगतान की गई राशि नॉन-रिफंडेबल (non-refundable) है। मैं यह भी प्रमाणित करता हूँ कि मैं Elite Toolistic द्वारा प्रदान की गई सहायता और सेवाओं (support@elitetoolistic.com) से पूरी तरह संतुष्ट हूँ। मैं यह भी वादा करता हूँ कि इस प्रोग्राम के दौरान मुझे दी गई किसी भी कॉपीराइटेड कोर्स सामग्री को साझा या वितरित नहीं करूँगा। यह स्टेटमेंट बिना किसी दबाव के, पूरी जानकारी के साथ और अपनी मर्जी से दिया जा रहा है।"
                      </p>
                    </div>
                  </div>

                </div>

              </div>

              {/* Row: Pin Code, State, City */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelClass}>PIN Code *</label>
                    {isFetchingPincode && (
                      <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 animate-pulse">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        Fetching...
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    placeholder="6-digit PIN"
                    value={pincode}
                    onChange={handlePincodeChange}
                    className={inputClass}
                  />
                  {pincodeError && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{pincodeError}</p>
                  )}
                  {pincodeSuccess && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 ml-1 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {pincodeSuccess}
                    </p>
                  )}
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
                    placeholder="City / District"
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <button 
                  type="button" 
                  onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Edit Step 1
                </button>

                <Link
                  to="/login"
                  id="admission-step2-back-login"
                  className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center gap-1.5"
                >
                  Back to Login
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
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

            {/* Back to Login Button */}
            <div className="pt-2">
              <Link
                to="/login"
                id="admission-success-back-login"
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-black text-[11px] py-4 rounded-2xl uppercase tracking-[0.25em] transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admission;
