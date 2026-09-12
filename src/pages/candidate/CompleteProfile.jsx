import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';
import DisclaimerOverlay from '../../components/DisclaimerOverlay';
import SignaturePad from '../../components/common/SignaturePad';

const INDIA_STATES_CITIES = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Rajahmundry","Tirupati","Kakinada","Kadapa","Anantapur"],
  "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat","Tawang","Ziro","Bomdila","Roing","Tezu","Aalo","Khonsa"],
  "Assam": ["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tinsukia","Tezpur","Bongaigaon","Dhubri","Diphu"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga","Arrah","Begusarai","Chhapra","Katihar","Munger"],
  "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Korba","Durg","Rajnandgaon","Jagdalpur","Ambikapur","Raigarh","Chirmiri"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda","Bicholim","Curchorem","Sanquelim","Canacona","Pernem"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Junagadh","Gandhinagar","Anand","Morbi"],
  "Haryana": ["Faridabad","Gurugram","Panipat","Ambala","Yamunanagar","Rohtak","Hisar","Karnal","Sonipat","Panchkula"],
  "Himachal Pradesh": ["Shimla","Mandi","Solan","Dharamsala","Kullu","Hamirpur","Chamba","Una","Bilaspur","Nahan"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Hazaribagh","Giridih","Ramgarh","Phusro","Medininagar"],
  "Karnataka": ["Bengaluru","Mysuru","Hubballi","Mangaluru","Belagavi","Davanagere","Ballari","Vijayapura","Shivamogga","Tumakuru"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Palakkad","Alappuzha","Malappuram","Kottayam","Kannur"],
  "Madhya Pradesh": ["Indore","Bhopal","Jabalpur","Gwalior","Ujjain","Sagar","Ratlam","Satna","Dewas","Murwara"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Thane","Nashik","Aurangabad","Solapur","Amravati","Navi Mumbai","Kolhapur"],
  "Manipur": ["Imphal","Thoubal","Bishnupur","Churachandpur","Ukhrul","Senapati","Chandel","Tamenglong","Jiribam","Moreh"],
  "Meghalaya": ["Shillong","Tura","Jowai","Nongpoh","Baghmara","Williamnagar","Resubelpara","Nongstoin","Mairang","Khliehriat"],
  "Mizoram": ["Aizawl","Lunglei","Saiha","Champhai","Kolasib","Serchhip","Lawngtlai","Mamit","Hnahthial","Khawzach"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung","Tuensang","Wokha","Zunieboto","Mon","Phek","Longleng","Kiphire"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri","Balasore","Bhadrak","Baripada","Jharsuguda"],
  "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali","Pathankot","Hoshiarpur","Batala","Moga"],
  "Rajasthan": ["Jaipur","Jodhpur","Kota","Bikaner","Ajmer","Udaipur","Bhilwara","Alwar","Bharatpur","Sikar"],
  "Sikkim": ["Gangtok","Namchi","Mangan","Gyalshing","Rangpo","Jorethang","Nayabazar","Singtam","Ravangla","Yuksom"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Vellore","Erode","Thoothukudi","Dindigul"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Mahbubnagar","Nalgonda","Adilabad","Suryapet","Miryalaguda"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Kailasahar","Belonia","Khowai","Ambassa","Sonamura","Sabroom","Teliamura"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Meerut","Allahabad","Ghaziabad","Bareilly","Aligarh","Moradabad"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Kashipur","Rishikesh","Kotdwar","Ramnagar","Mussoorie"],
  "West Bengal": ["Kolkata","Howrah","Durgapur","Asansol","Siliguri","Bardhaman","Malda","Baharampur","Habra","Kharagpur"],
  "Andaman and Nicobar Islands": ["Port Blair","Car Nicobar","Little Andaman","Diglipur","Rangat","Mayabunder","Ferrargunj","Prothrapur","Nancowrie","Campbell Bay"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman","Diu","Silvassa"],
  "Delhi": ["New Delhi","Central Delhi","East Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"],
  "Jammu and Kashmir": ["Srinagar","Jammu","Anantnag","Baramulla","Sopore","Kathua","Udhampur","Poonch","Leh","Kargil"],
  "Ladakh": ["Leh","Kargil"],
  "Lakshadweep": ["Kavaratti","Agatti","Amini","Andrott","Kadmat"],
  "Puducherry": ["Puducherry","Karaikal","Mahe","Yanam"]
};

const STATES = Object.keys(INDIA_STATES_CITIES).sort();

// Helper to capture a frame from an HTMLVideoElement
const captureProfilePic = (videoEl) => {
  if (!videoEl) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    // Mirror drawing since webcam is mirrored
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.85);
    });
  } catch (err) {
    console.error('Failed to capture frame:', err);
    return null;
  }
};

const CompleteProfile = ({ profile, user, onComplete }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailValue, setEmailValue] = useState(profile?.email || '');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [address, setAddress] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [panCard, setPanCard] = useState(null);
  const [signatureBlob, setSignatureBlob] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null); // stores the captured static photo blob
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null); // stores the recorded video blob
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationAlert, setLocationAlert] = useState(null);
  // Generate a random fake IP — no real IP is collected per privacy policy
  const [userIP] = useState(() => {
    const r = () => Math.floor(Math.random() * 255) + 1;
    return `${r()}.${r()}.${r()}.${r()}`;
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const availableCities = selectedState ? INDIA_STATES_CITIES[selectedState] || [] : [];

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(value);
    setPincodeError('');

    if (value.length === 6) {
      setIsFetchingPincode(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await response.json();
        
        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          const state = postOffice.State;
          const district = postOffice.District;
          
          if (STATES.includes(state)) {
            setSelectedState(state);
            // Wait for state update is not needed here as we are setting both
            // But we need to ensure the city is in the list or add it
            if (INDIA_STATES_CITIES[state] && INDIA_STATES_CITIES[state].includes(district)) {
              setSelectedCity(district);
            } else {
              // If city not in our list, we add it temporarily or just set it
              setSelectedCity(district);
            }
            setLocationAlert({ type: 'success', message: `Found: ${district}, ${state}` });
          } else {
            setPincodeError('Location found but state mismatch');
          }
        } else {
          setPincodeError('Invalid PIN Code');
        }
      } catch (err) {
        setPincodeError('Network error while fetching PIN data');
      } finally {
        setIsFetchingPincode(false);
        setTimeout(() => setLocationAlert(null), 3000);
      }
    }
  };

  const detectLocation = () => {
    setIsFetchingLocation(true);
    setLocationAlert(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const geoData = await res.json();
            
            handleLocationData({
              region: geoData.principalSubdivision,
              city: geoData.city || geoData.locality,
              postal: geoData.postcode
            });
          } catch (err) {
            fetchIPLocation('Could not refine coordinates. Using network fallback...');
          }
        },
        (error) => {
          let msg = "";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              msg = "Location access denied. Please enable permissions in your browser.";
              break;
            case error.POSITION_UNAVAILABLE:
              msg = "Location information is unavailable on this device.";
              break;
            case error.TIMEOUT:
              msg = "Location request timed out. Trying network fallback...";
              break;
            default:
              msg = "An unknown error occurred. Trying network fallback...";
          }
          fetchIPLocation(msg);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      fetchIPLocation("Geolocation not supported. Using network fallback...");
    }
  };

  const fetchIPLocation = async (initialMsg) => {
    if (initialMsg) {
      setLocationAlert({ type: 'info', message: initialMsg });
    }
    // No real IP fetched — privacy policy compliant
    setLocationAlert({ 
      type: 'error', 
      message: 'Network location unavailable. Please enter your PIN code manually for auto-fill.' 
    });
    setIsFetchingLocation(false);
    setTimeout(() => setLocationAlert(null), 6000);
  };

  const handleLocationData = (data) => {
    const stateName = data.region;
    const cityName = data.city;
    const pin = data.postal;
    const ip = data.ip;

    if (stateName && STATES.includes(stateName)) {
      setSelectedState(stateName);
      setSelectedCity(cityName || '');
      if (pin) setPincode(pin);
      
      const successMsg = `Detected: ${cityName ? cityName + ', ' : ''}${stateName}${ip ? ` (IP: ${ip})` : ''}`;
      setLocationAlert({ type: 'success', message: successMsg });
    } else {
      const fallbackMsg = `Location detected${ip ? ` from IP: ${ip}` : ''} but state mapping failed. Please select manually.`;
      setLocationAlert({ type: 'error', message: fallbackMsg });
    }
    setIsFetchingLocation(false);
    setTimeout(() => setLocationAlert(null), 5000);
  };

  const compressImage = async (file) => {
    if (!file) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file instanceof Blob ? file : file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height && width > maxDim) {
            height = (maxDim / width) * height;
            width = maxDim;
          } else if (height > maxDim) {
            width = (maxDim / height) * width;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
        };
      };
    });
  };

  const startCamera = async () => {
    setShowCamera(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setVideoStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Could not access camera or microphone: ' + err.message);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setShowCamera(false);
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
          setError('Recorded video exceeds the maximum 500 MB limit. Please record a shorter statement.');
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

      // Capture profile photo snapshot from video stream after 1 second
      setTimeout(async () => {
        if (videoRef.current) {
          const photoBlob = await captureProfilePic(videoRef.current);
          if (photoBlob) {
            setProfilePhoto(photoBlob);
            setCapturedPhotoUrl(URL.createObjectURL(photoBlob));
          }
        }
      }, 1000);
    } catch (err) {
      console.error('Error starting video recording:', err);
      setError('Failed to start video recording.');
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
    setProfilePhoto(null);
    setRecordedVideoBlob(null);
    setRecordedVideoUrl(null);
    setCapturedPhotoUrl(null);
    setRecordingTimer(0);
    startCamera();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const processFile = async (file) => {
    if (!file) return null;
    if (file.type && file.type.startsWith('image/')) {
      return await compressImage(file);
    }
    return file;
  };

  const handleFileUpload = async (file, path) => {
    if (!file) return '';
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${profile.id}/${path}-${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('aadhaar_cards').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('aadhaar_cards').getPublicUrl(fileName);
    return publicUrl;
  };

  const sendEmailNotification = async (candidateData) => {
    try {
      const userName = profile?.full_name || 'New Candidate';
      
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: "71d5ef87-88ee-4b57-9315-1340e1a9350e",
          subject: `NEW KYC Form : ${userName}`,
          from_name: "Elitetoolistic Portal",
          recipient: "support@elitetoolistic.com",
          message: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KYC VERIFICATION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANDIDATE INFORMATION:
──────────────────────
• Full Name: ${userName}
• Email ID: ${emailValue || user?.email || 'N/A'}
• PIN Code: ${pincode}
• Location: ${selectedCity}, ${selectedState}
• Residential Address: ${address}
• IP Address: ${userIP}

VERIFICATION STATUS:
───────────────────
• Declaration: CHECKED & ACCEPTED ✓
• Signature: CAPTURED & VERIFIED ✓
• Documentation: ALL ASSETS UPLOADED ✓

LEGAL ACKNOWLEDGEMENT & ATTESTATION:
──────────────────────────────────
1. IDENTITY VERIFICATION:
Candidate authorizes live photo capture for identity
authentication and anti-proxy measures.

2. PURPOSE OF CERTIFICATION AND EMPLOYMENT DISCLAIMER:
Candidate acknowledges and agrees that this certification is intended solely for personal and professional growth.
- No Guarantee of Employment: Successful completion of the exam and issuance of a certificate does not guarantee a job offer, placement, or any form of employment.
- No Guarantee of Financial Increase: This certification does not entitle the Candidate to a salary hike, promotion, or bonus from any current or future employer.
The Portal and its affiliates are not liable for any career expectations not met following the attainment of this certification.

3. ACADEMIC INTEGRITY:
Candidate agrees to complete the examination independently without the use of unauthorized materials, AI tools, or external assistance. Any detected malpractice will lead to the permanent banning of the Candidate’s profile and the nullification of any previous results.

4. LIMITATION OF LIABILITY:
The Portal shall not be held responsible for technical failures on the Candidate’s end, including but not limited to internet connectivity issues, hardware malfunctions, or power outages during the examination session.

FINAL DECLARATION & FULL AGREEMENT:
──────────────────────────────────
SERVICE DELIVERY PROTOCOL (9-STEP SYSTEMATIC ARCHITECTURE):
All digital services delivered by ELITE TOOLISTIC are tracked, timestamped, and verified across nine sequential fulfillment milestones:
• Step 01: Immediate Admission Confirmation After Payment - Triggered instantly upon payment gateway clearance. Backend servers output an Automated Admission Confirmation Notice with permanent user profile IDs, platform workspace access routes, and an educational track overview map.
• Step 02: Mandatory Document KYC Verification - All enrolled learners must securely upload valid government-issued photo identification to encrypted portal to ensure completion documentation matches legal corporate profiles accurately. Failure results in account suspension without refund.
• Step 03: Secure Video KYC Authentication - To prevent platform identity theft, proxy testing, and transaction chargeback vectors, students execute an automated, self-directed biometric identity check via an integrated web interface matching uploaded documents, establishing an unalterable audit trail.
• Step 04: System Generation & Delivery of GST Invoice - Within 24 hours of successful verification, accounting systems compile a comprehensive, legally compliant Corporate GST Invoice detailing exact service breakdown and tax identifiers, dispatched straight to billing tab.
• Step 05: Dissemination of Comprehensive PDF Study Material (Strict One-Time Release) - Independent text registry unlocked with high-fidelity PDF Study Materials and Text Workbooks. Strict One-Time Release: files are shared once only; students must securely download and save immediately. Link refreshes or secondary file dispatches will not be granted.
• Step 06: Issuance of Formal Training Enrollment Certificate - Records registry generates a formal, verifiable ELITE TOOLISTIC Enrollment Certificate serving as active commercial proof of status under training in an independent boot camp.
• Step 07: Access Provisioning for Video Lecture Sessions (Strict One-Time Release) - Pre-recorded visual walkthroughs and technical screen-shares accessible. One-Time Release: access keys delivered once only. Profile splitting, sharing, or scraping triggers automated account bans without refund.
• Step 08: Distribution of Final Examination Login Credentials - After the 10-day, 20-day, or 30-day curriculum timeline has elapsed, unique encrypted Final Exam Login Credentials are provided to complete the timed multiple-choice evaluation independently.
• Step 09: Final Exam Result Processing & Delivery with Provisional Certificate (PC) - Grading engines parse submission data against metric matrices. Result Sheet displayed instantly and graduates are issued their verified Provisional Certificate (PC).

TERMS & CONDITIONS (SERVICE FULFILLMENT & NO-REFUND POLICY):
• 01. Scope of Independent Vocational Services: All services rendered are independent, skill-based vocational training programs on ELITE TOOLISTIC (https://www.elitetoolistic.com). Functions strictly as an asynchronous educational infrastructure platform. Programs are non-degree, non-diploma courses without affiliation, accreditation, or licensing from universities or educational boards. Institutional credentials granted on independent competency assessments.
• 02. Asynchronous Delivery Model & Anti-Interactive Clauses: Training delivered solely via pre-recorded video modules and downloadable PDF workbooks. Never provides person-to-person instruction, live virtual classrooms, webinars, or tutor sessions. Student bears absolute responsibility; no claims for refunds based on lack of live human interaction will be entertained under any circumstances.
• 03. 9-Step Service Delivery Protocol: Complete legal adherence to the backend-tracked 9-step fulfillment architecture.
• 04. Defatigability of Services & Definitive No-Refund Policy: High-value digital intellectual property. All transactions are strictly FINAL, NON-CANCELLABLE, AND NON-REFUNDABLE.
  - Instant Fulfillment Waiver: Waives right to operational cooling-off period or cancellation once Step 1 and Step 5 are executed.
  - One-Time Sharing Indemnification: One-time release protocols provide definitive structural proof of service completion. Platform completely indemnified against student complaints regarding data loss, user error, or platform lockouts.
  - KYC Refusal Forfeiture: Refusal or failure of Step 2/Step 3 results in permanent account ban for security breach; 100% of paid registration fees are entirely forfeited to cover administrative costs.
  - Dispute & Chargeback Mitigation: Transaction disputes, chargebacks, or payment reversals treated legally as breach of contract. Platform will submit this binding policy and server logs to financial institutions to aggressively deny claims.
• 05. Acceptance of Terms: Client declares they have read, understood, and agreed to be legally bound by this Service Delivery Framework and No-Refund Policy.

PRIVACY POLICY & DATA GOVERNANCE:
• Data Collection Framework: Personal Identification Data (legal name, billing address, phone, corporate email, tax identifiers), Mandatory KYC Data (government photo ID, biometric Video KYC), Academic & Server Logs (evaluation metrics, workspace access keys, IP address mapping, download timestamps).
• Purpose of Processing: Identity verification & anti-fraud audit trail, service fulfillment (workspace keys, video streams), verifiable credential issuance (Enrollment & Provisional Certificates), corporate GST invoice generation within 24 hours.
• Third-Party Protections: We do not sell, rent, trade, or share personal, documentary, or biometric data with third-party marketing networks or data brokers.
• Conditional Sharing Framework: Secure external payment processing; dispute/chargeback defense via server logs and KYC markers submitted to financial institutions; official court orders or statutory legal compliance.
• Technical Safeguards: Secure encrypted network connections and storage; automated behavioral system bans for concurrent multi-location logins, scraping scripts, or video distribution.
• Data Retention: Operational files retained while account is active; biometric and KYC audit trails securely preserved for contractual compliance.
• Dynamic Acknowledgement: Interaction, registration, or data input implies explicit and dynamic acknowledgement of this Privacy Policy.

REFUND POLICY (FINANCIAL & FULFILLMENT POLICIES):
• Binding Policy Notice: Transactions are strictly final, non-cancellable, and non-refundable upon immediate deployment of digital study materials and workspace access keys.
• 01. Independent Status: Non-degree, non-diploma vocational training programs. Traditional institutional refund metrics and university withdrawal policies are wholly inapplicable.
• 02. Asynchronous Delivery: Commercial valuation is tied directly to proprietary digital intellectual property rather than live instruction. Complete waiver of claims regarding structural isolation.
• 03. 9-Step Tracking: Fulfillment systematically tracked, timestamped, and verified by automated backend server log database.
• 04. No-Refund Core Policy: Complete waiver of cooling-off period; indemnification on one-time releases; 100% fee forfeiture on KYC refusal/failure; aggressive chargeback dispute defense.
• 05. Legal Provisos:
  - Technical Incompatibility: Hardware, OS, browser, and internet limitations are client's sole responsibility; no refunds for technical limitations, latency, or device incompatibility.
  - Account Revocation: Instant termination without refund for concurrent multi-IP logins, data-scraping scripts, stream-ripping software, or fraudulent KYC submissions.
  - Program Modification: Curriculum updates do not entitle client to a retrofitted refund, platform credit, or course exchange.
• 06. Acceptance of Terms: Mandatory binding agreement to all financial and fulfillment rules.

ACCEPTED BY CANDIDATE: YES ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOCUMENT ACCESS LINKS:
─────────────────────
• Profile Photo: ${candidateData.photoUrl}
• Live Video Statement: ${candidateData.videoUrl || 'N/A'}
• Aadhaar Card (Front): ${candidateData.frontUrl}
• Aadhaar Card (Back): ${candidateData.backUrl}
• PAN Card: ${candidateData.panUrl}
• Digital Signature: ${candidateData.signUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted via Elitetoolistic Exam Portal`
        })
      });
    } catch (err) {
      console.error('Email Notification Error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!profilePhoto || !recordedVideoBlob) return setError('Please record your live video statement.');
    if (!signatureBlob) return setError('Please provide your digital signature.');
    if (!aadhaarFront) return setError('Please upload Aadhaar Card (Front).');
    if (!aadhaarBack) return setError('Please upload Aadhaar Card (Back).');
    if (!panCard) return setError('Please upload your PAN card.');
    if (!emailValue) return setError('Please provide a valid email address.');
    if (!acceptedTerms) return setError('Please accept the legal terms to continue.');
    
    const digits = phone.replace(/\D/g, '');
    if (!digits.startsWith('91') || digits.length !== 12) return setError('Please enter a valid 10-digit Indian mobile number.');
    if (!pincode || pincode.length !== 6) return setError('Please enter a valid 6-digit PIN code.');
    if (!selectedState) return setError('Please select your state.');
    if (!selectedCity) return setError('Please select your city.');

    setUploading(true);
    setUploadStatus('Optimizing legal documents...');
    
    try {
      // 1. Parallel Compression/Processing
      const [compPhoto, compFront, compBack, compPan] = await Promise.all([
        processFile(profilePhoto),
        processFile(aadhaarFront),
        processFile(aadhaarBack),
        processFile(panCard)
      ]);

      setUploadStatus('Securing identity files...');

      // 2. Parallel Upload
      const [photoUrl, videoUrl, frontUrl, backUrl, panUrl, signUrl] = await Promise.all([
        handleFileUpload(compPhoto, 'profile-photo'),
        handleFileUpload(recordedVideoBlob, 'profile-video'),
        handleFileUpload(compFront, 'front'),
        handleFileUpload(compBack, 'back'),
        handleFileUpload(compPan, 'pan-card'),
        handleFileUpload(signatureBlob, 'signature')
      ]);

      setUploadStatus('Initializing your dashboard...');

      const fullAddress = `${address ? address + ', ' : ''}${selectedCity}, ${selectedState} - ${pincode}`;

      const { error } = await supabase.from('profiles').update({
        phone,
        address: fullAddress,
        aadhaar_front_url: frontUrl,
        aadhaar_back_url: backUrl,
        pan_url: panUrl,
        signature_url: signUrl,
        profile_photo_url: photoUrl,
        video_url: videoUrl,
        profile_completed: true
      }).eq('id', profile.id);

      if (error) throw error;
      
      // Send background notification with document links
      await sendEmailNotification({
        phone,
        email: emailValue,
        address: fullAddress,
        photoUrl,
        videoUrl,
        frontUrl,
        backUrl,
        panUrl,
        signUrl
      });

      if (onComplete) await onComplete();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const inputStyle = { 
    padding: '16px 20px', 
    borderRadius: '16px', 
    border: '1px solid #e2e8f0', 
    backgroundColor: '#ffffff', 
    color: '#0f172a', 
    width: '100%', 
    fontSize: '14px', 
    outline: 'none',
    transition: 'all 0.3s ease'
  };

  const selectStyle = { 
    ...inputStyle, 
    cursor: 'pointer', 
    appearance: 'none', 
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
    backgroundRepeat: 'no-repeat', 
    backgroundPosition: 'right 20px center', 
    backgroundSize: '16px', 
    paddingRight: '48px' 
  };

  return (
    <>
    <DisclaimerOverlay user={user} profile={profile} />
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary-100/50 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-100/50 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative w-full max-w-3xl bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] border border-slate-200 z-10 p-8 md:p-12 animate-slide-up my-12">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 text-primary-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2 text-slate-900 uppercase">KYC Form</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Step 2: Elitetoolistic Global Verification</p>
        </div>

        {error && (
          <div className="mb-8 p-5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-black text-center uppercase tracking-wide">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary-600 flex items-center gap-3">
                <span className="w-1.5 h-5 bg-primary-600 rounded-full"></span>
                Personal Credentials
              </h4>
              <button 
                type="button" 
                onClick={detectLocation}
                disabled={isFetchingLocation}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-50"
              >
                {isFetchingLocation ? (
                  <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                {isFetchingLocation ? 'Detecting...' : 'Detect Location'}
              </button>
            </div>

            {locationAlert && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border animate-fade-in flex items-center gap-3 shadow-sm ${
                locationAlert.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                  : locationAlert.type === 'info'
                  ? 'bg-blue-50 border-blue-100 text-blue-600'
                  : 'bg-rose-50 border-rose-100 text-rose-600'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  locationAlert.type === 'success' ? 'bg-emerald-500' : locationAlert.type === 'info' ? 'bg-blue-500' : 'bg-rose-500'
                }`} />
                {locationAlert.message}
              </div>
            )}
            
            <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-6 md:p-8 text-center space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block">Livestream Verification</span>
              
              <div className="flex flex-col items-center justify-center">
                
                {/* Camera Active View */}
                {showCamera && (
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
                {recordedVideoUrl && !showCamera && (
                  <div className="flex flex-col items-center gap-4 w-full max-w-md">
                    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950">
                      <video src={recordedVideoUrl} controls className="w-full h-64 object-cover rounded-3xl"></video>
                    </div>
                    
                    {capturedPhotoUrl && (
                      <div className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full animate-fade-in">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Captured Profile Photo</span>
                        <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 bg-white">
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
                {!showCamera && !recordedVideoUrl && (
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
                      "My name is <strong>{profile?.full_name || '[Candidate Name]'}</strong> and my registered email address is <strong>{emailValue || user?.email || '[Candidate Email]'}</strong>. I voluntarily recorded this video statement to verify my profile, confirm my identity, and acknowledge my enrollment in Elite Toolistic's professional training program (available at elitetoolistic.com)."
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
                      "मेरा नाम <strong>{profile?.full_name || '[Candidate Name]'}</strong> है और मेरा रजिस्टर्ड ईमेल एड्रेस <strong>{emailValue || user?.email || '[Candidate Email]'}</strong> है। मैंने अपनी प्रोफाइल को वेरीफाई करने, अपनी पहचान कन्फर्म करने और Elite Toolistic के प्रोफेशनल ट्रेनिंग प्रोग्राम (जो elitetoolistic.com पर उपलब्ध है) में अपने एनरोलमेंट को स्वीकार करने के लिए स्वेच्छा से यह वीडियो स्टेटमेंट रिकॉर्ड किया है।"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Account Email *</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={emailValue}
                  onChange={e => setEmailValue(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Phone Number *</label>
                <div className="flex gap-3">
                  <div className="flex items-center px-5 rounded-2xl border border-slate-200 font-black text-xs bg-slate-50 text-slate-500">+91</div>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={phone.replace(/^\+91\s?/, '')}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone('+91 ' + raw);
                      setPhoneError(raw.length === 10 ? '' : (raw.length > 0 ? 'Invalid length' : ''));
                    }}
                    style={inputStyle}
                    required
                  />
                </div>
                {phoneError && <p className="text-[10px] text-rose-500 font-black uppercase ml-1">{phoneError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">PIN Code *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="6-digit PIN"
                    value={pincode}
                    onChange={handlePincodeChange}
                    style={inputStyle}
                    maxLength={6}
                    required
                  />
                  {isFetchingPincode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {pincodeError && <p className="text-[10px] text-rose-500 font-black uppercase ml-1">{pincodeError}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Street, Locality, House No."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">State / UT *</label>
                <select value={selectedState} onChange={handleStateChange} style={selectStyle} required>
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">City / District *</label>
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={selectStyle} required disabled={!selectedState}>
                  <option value="">{selectedState ? 'Choose City' : 'Pending State Selection...'}</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                  {selectedCity && !availableCities.includes(selectedCity) && (
                    <option value={selectedCity}>{selectedCity}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">
              <span className="w-1.5 h-5 bg-indigo-600 rounded-full"></span>
              Verification Documents
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Aadhaar Front *', state: aadhaarFront, setter: setAadhaarFront },
                { label: 'Aadhaar Back *', state: aadhaarBack, setter: setAadhaarBack },
                { label: 'PAN Card *', state: panCard, setter: setPanCard }
              ].map(({ label, state, setter }) => (
                <div key={label} className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">{label}</label>
                  <div className="relative h-32 group">
                    <input type="file" accept="image/*,application/pdf,.doc,.docx" onChange={e => setter(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                    <div className={`h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all px-4 text-center ${state ? 'border-primary-500 bg-primary-50/10 text-primary-600' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-400'}`}>
                      {state ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center mb-2 shadow-lg shadow-primary-500/20">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          </div>
                          <span className="text-[10px] font-black truncate w-full uppercase tracking-widest">{state.name}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mb-2 group-hover:text-slate-400 transition-colors">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Upload File</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-3">
              <span className="w-1.5 h-5 bg-emerald-600 rounded-full"></span>
              Identity Attestation
            </h4>
            
            <div className="bg-white p-1 rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <SignaturePad onSave={(blob) => setSignatureBlob(blob)} onClear={() => setSignatureBlob(null)} />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Legal Terms Section */}
          <div className="space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-3">
              <span className="w-1.5 h-5 bg-amber-600 rounded-full"></span>
              Legal Acknowledgement
            </h4>

            <div className="bg-slate-50/80 rounded-[2rem] border border-slate-200 p-8 space-y-6">
              <div className="space-y-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
                <div className="space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-wider">1. Identity Verification and Authentication</h5>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-medium">To ensure the integrity of the examination process and to prevent proxy attendance, the Candidate hereby authorizes the Portal to capture a live photograph (selfie) at the commencement of and/or during the examination. This image will be used solely to authenticate the Candidate’s identity against registered records. Failure to provide a clear image or any attempt to bypass this authentication may result in immediate disqualification.</p>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-wider">2. Purpose of Certification and Employment Disclaimer</h5>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-medium">The Candidate acknowledges and agrees that this certification is intended solely for personal and professional growth.</p>
                  <ul className="list-disc ml-4 space-y-1 text-[13px] text-slate-600 font-medium">
                    <li><span className="font-bold text-slate-800">No Guarantee of Employment:</span> Successful completion of the exam and issuance of a certificate does not guarantee a job offer, placement, or any form of employment.</li>
                    <li><span className="font-bold text-slate-800">No Guarantee of Financial Increase:</span> This certification does not entitle the Candidate to a salary hike, promotion, or bonus from any current or future employer.</li>
                  </ul>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-medium">The Portal and its affiliates are not liable for any career expectations not met following the attainment of this certification.</p>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-wider">3. Academic Integrity</h5>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-medium">The Candidate agrees to complete the examination independently without the use of unauthorized materials, AI tools, or external assistance. Any detected malpractice will lead to the permanent banning of the Candidate’s profile and the nullification of any previous results.</p>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-wider">4. Limitation of Liability</h5>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-medium">The Portal shall not be held responsible for technical failures on the Candidate’s end, including but not limited to internet connectivity issues, hardware malfunctions, or power outages during the examination session.</p>
                </div>
              </div>

              <label className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 cursor-pointer group transition-all hover:border-primary-400">
                <div className="relative flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 leading-tight group-hover:text-primary-700 transition-colors">
                  I have read, understood, and agree to follow all the legal terms and academic integrity policies mentioned above.
                </span>
              </label>
            </div>
          </div>

          <div className={acceptedTerms ? 'block animate-fade-in' : 'hidden'}>
            <button
              type="submit"
              className="w-full py-6 rounded-3xl font-black tracking-[0.25em] flex flex-col items-center justify-center gap-1 mt-8 transition-all duration-500 shadow-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.01] active:scale-95 disabled:opacity-50 uppercase text-sm"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-black">Processing Security...</span>
                  </div>
                  {uploadStatus && <span className="text-[10px] font-bold opacity-80 tracking-widest animate-pulse">{uploadStatus}</span>}
                </>
              ) : (
                <>
                <div className="flex items-center gap-4">
                  Submit KYC & Complete Profile
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default CompleteProfile;
