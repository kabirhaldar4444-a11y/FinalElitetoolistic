/**
 * Smart Candidate Exam Portal Session Tracker (Admin-Only Audit)
 * 
 * Tracks candidate exam portal duration from login to exit/submission in any condition.
 * Sends confidential report via Web3Forms strictly to Admin.
 */

const WEB3FORMS_API = 'https://api.web3forms.com/submit';

/**
 * Helper to format duration in milliseconds to human-readable string
 */
export const formatDurationMs = (ms) => {
  if (!ms || ms <= 0) return '0 Seconds';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec`);
  return parts.join(' ');
};

/**
 * Record portal login time when a candidate starts their session
 */
export const recordPortalLogin = (user, profile) => {
  try {
    // Persist login time in sessionStorage if not already recorded for this browser session
    if (!sessionStorage.getItem('candidate_portal_login_time')) {
      const now = Date.now();
      sessionStorage.setItem('candidate_portal_login_time', now.toString());
      sessionStorage.setItem('candidate_portal_login_display', new Date(now).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      }));
    }

    // Cache candidate IP if not present
    if (!localStorage.getItem('candidate_kyc_ip')) {
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
          if (data?.ip) localStorage.setItem('candidate_kyc_ip', data.ip);
        })
        .catch(() => {
          if (profile?.ip_address) localStorage.setItem('candidate_kyc_ip', profile.ip_address);
        });
    }
  } catch (err) {
    console.debug('Session record notice:', err);
  }
};

/**
 * Record when candidate initiates a specific exam
 */
export const recordExamStart = (examId) => {
  try {
    if (!examId) return;
    const now = Date.now();
    const currentSessionToken = `${now}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(`exam_start_time_${examId}`, now.toString());
    sessionStorage.setItem(`exam_session_token_${examId}`, currentSessionToken);
  } catch (err) {
    console.debug('Exam start record notice:', err);
  }
};

/**
 * Dispatch confidential audit report to Admin via Web3Forms
 * Works across all exit conditions: Submit, Back to Dashboard, or Browser/Tab Close
 */
export const sendExamSessionAudit = ({
  exam,
  user,
  profile,
  exitCondition = 'Normal Exit'
}) => {
  try {
    if (!exam?.id) return;

    // Deduplication check: prevent multiple emails for the same exit
    const sessionToken = sessionStorage.getItem(`exam_session_token_${exam.id}`) || 'active';
    const dedupeKey = `exam_audit_sent_${exam.id}_${sessionToken}`;
    if (sessionStorage.getItem(dedupeKey)) {
      console.debug('[Exam Audit] Already sent for this exam session.');
      return;
    }
    sessionStorage.setItem(dedupeKey, 'true');

    // Calculate timestamps and durations
    const now = Date.now();
    const portalLoginStored = sessionStorage.getItem('candidate_portal_login_time');
    const portalLoginTime = portalLoginStored ? parseInt(portalLoginStored, 10) : now;
    const portalLoginDisplay = sessionStorage.getItem('candidate_portal_login_display') || new Date(portalLoginTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });

    const examStartStored = sessionStorage.getItem(`exam_start_time_${exam.id}`);
    const examStartTime = examStartStored ? parseInt(examStartStored, 10) : portalLoginTime;

    const totalPortalMs = Math.max(0, now - portalLoginTime);
    const examDurationMs = Math.max(0, now - examStartTime);

    const totalPortalDuration = formatDurationMs(totalPortalMs);
    const examDuration = formatDurationMs(examDurationMs);
    const exitTimestampDisplay = new Date(now).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });

    const candidateName = profile?.full_name || user?.user_metadata?.full_name || 'Candidate';
    const candidateEmail = user?.email || profile?.email || 'audit@elitetoolistic.com';
    const candidateIp = localStorage.getItem('candidate_kyc_ip') || profile?.ip_address || 'Not captured';
    const examAllowedTime = `${exam.duration || 0} Minutes`;

    const accessKey = import.meta.env.VITE_ADMIN_WEB3FORMS_KEY || '63db5153-9931-43f2-9523-44f7ba059004';
    const recipientEmail = import.meta.env.VITE_ADMIN_NOTIFICATION_EMAIL || '';

    const subject = `Exam Session Ended — ${candidateName} (${totalPortalDuration})`;

    const emailMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE EXAM SESSION AUDIT REPORT
[STRICTLY CONFIDENTIAL — FOR ADMIN ONLY]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANDIDATE DETAILS:
• Full Name: ${candidateName}
• Email Address: ${candidateEmail}
• IP Address: ${candidateIp}

EXAM INFORMATION:
• Exam Title: ${exam.title || 'Assessment'}
• Allowed Exam Duration: ${examAllowedTime}

PORTAL & EXAM DURATION TIMELINES:
• Portal Entry / Login Time: ${portalLoginDisplay}
• Portal Exit / Stop Time: ${exitTimestampDisplay}
• Total Time Used in Portal: ${totalPortalDuration}
• Time Spent on Exam Screen: ${examDuration}

EXIT CIRCUMSTANCE:
• Trigger Condition: ${exitCondition}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Automated Security Tracking System • Elitetoolistic Portal
`;

    const payload = {
      access_key: accessKey,
      subject: subject,
      from_name: 'Elitetoolistic Security Audit',
      email: candidateEmail && candidateEmail.includes('@') ? candidateEmail : 'support@elitetoolistic.com',
      message: emailMessage
    };

    if (recipientEmail) {
      payload.recipient = recipientEmail;
    }

    const sendRequest = async (keyToUse) => {
      const currentPayload = { ...payload, access_key: keyToUse };
      const jsonBody = JSON.stringify(currentPayload);

      try {
        const res = await fetch(WEB3FORMS_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: jsonBody,
          keepalive: true
        });

        const data = await res.json();
        if (data.success) {
          console.log('[Exam Audit Tracker] Email successfully dispatched:', data.message || 'Delivered');
          return true;
        } else {
          console.error('[Exam Audit Tracker] Web3Forms Error:', data.message || data);
          return false;
        }
      } catch (err) {
        console.warn('[Exam Audit Tracker] Network Error:', err);
        return false;
      }
    };

    // Primary attempt with configured key
    sendRequest(accessKey).then(success => {
      // If primary key failed (e.g. unverified new key), automatically fallback to primary working portal key
      if (!success && accessKey !== '71d5ef87-88ee-4b57-9315-1340e1a9350e') {
        console.warn('[Exam Audit Tracker] Retrying with backup verified key...');
        sendRequest('71d5ef87-88ee-4b57-9315-1340e1a9350e');
      }
    });
  } catch (err) {
    console.debug('Failed to send session audit:', err);
  }
};

