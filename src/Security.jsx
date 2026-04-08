import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { ShieldCheck, Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const Security = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: '❌ PASSWORDS DO NOT MATCH' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: '❌ PASSWORD MUST BE AT LEAST 6 CHARACTERS' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setStatus({ type: 'error', message: `❌ UPDATE FAILED: ${error.message}` });
    } else {
      setStatus({ type: 'success', message: '✅ PASSWORD UPDATED SUCCESSFULLY' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="security-container animate-fade">
      <div className="dashboard-header">
        <div>
          <h1 className="main-title" style={{ marginBottom: '4px' }}>Security Protocol</h1>
          <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px' }}>
            MANAGE ACCESS CREDENTIALS AND SYSTEM INTEGRITY.
          </p>
        </div>
        <div className="system-time">
          <ShieldCheck size={14} /> ENCRYPTED
        </div>
      </div>

      <div className="security-content" style={{ marginTop: '3rem' }}>
        <div className="prompt-card big" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="prompt-label">
            <span><Lock size={16} /> Update Access Password</span>
          </div>
          
          <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="login-input-wrapper" style={{ margin: 0 }}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Access Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="login-input"
                style={{ width: '100%' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="login-input-wrapper" style={{ margin: 0 }}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="login-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <button 
              className="google-login-btn" 
              type="submit" 
              disabled={loading} 
              style={{ height: '55px', width: '100%', marginTop: '10px' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              <span style={{ fontSize: '1rem', letterSpacing: '1px' }}>
                {loading ? 'UPDATING SYSTEMS...' : 'RECONFIGURE ACCESS'}
              </span>
            </button>
          </form>

          {status.message && (
            <div 
              className={`login-message ${status.type}`} 
              style={{ 
                marginTop: '20px',
                padding: '15px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                color: status.type === 'success' ? '#22c55e' : '#ef4444'
              }}
            >
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {status.message}
            </div>
          )}
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>SECURITY NOTE: Changing your password will update access for all authorized terminals.</p>
          <p>Multi-factor authentication is currently standing by.</p>
        </div>
      </div>
    </div>
  );
};

export default Security;
