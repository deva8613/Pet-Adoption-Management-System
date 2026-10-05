import React from 'react';
import { AlertTriangle, Clock, XCircle, CheckCircle } from 'lucide-react';

const ShelterVerificationBanner = ({ status, reason }) => {
  if (!status || status === 'Approved') return null;

  let bg = '#fef3c7';
  let border = '#fde047';
  let textColor = '#92400e';
  let Icon = Clock;
  let title = 'Shelter Account Pending Admin Approval';
  let message = 'Your shelter profile is under review by system administrators. You cannot list new pets until approved.';

  if (status === 'Rejected') {
    bg = '#fef2f2';
    border = '#fca5a5';
    textColor = '#991b1b';
    Icon = XCircle;
    title = 'Shelter Account Verification Rejected';
    message = reason ? `Reason: ${reason}` : 'Your shelter account verification request was not approved.';
  } else if (status === 'Suspended') {
    bg = '#fff7ed';
    border = '#fdba74';
    textColor = '#c2410c';
    Icon = AlertTriangle;
    title = 'Shelter Account Suspended';
    message = reason ? `Reason: ${reason}` : 'Your shelter account has been suspended by administrators.';
  }

  return (
    <div style={{
      backgroundColor: bg,
      border: `1px solid ${border}`,
      color: textColor,
      borderRadius: '10px',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
      <Icon size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>{title}</strong>
        <span style={{ fontSize: '0.875rem' }}>{message}</span>
      </div>
    </div>
  );
};

export default ShelterVerificationBanner;
