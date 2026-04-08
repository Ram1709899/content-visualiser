import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { ShieldCheck, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fixed Email
  const FIXED_EMAIL = 'ramsaiyenugadhati@gmail.com';

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: FIXED_EMAIL,
      password: password,
    });

    if (error) {
      setMessage(`❌ ACCESS DENIED: ${error.message}`);
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="login-card animate-fade">
        <div className="login-icon">
          <ShieldCheck size={64} color="var(--primary)" />
        </div>
        <h1>Command Center</h1>
        <p className="login-subtitle">AUTHORIZED ACCESS ONLY</p>
        <p className="login-desc" style={{ fontSize: '0.8rem' }}>IDENTIFIED: {FIXED_EMAIL}</p>

        <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="login-input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Command Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="google-login-btn" type="submit" disabled={loading} style={{ height: '55px' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            <span style={{ fontSize: '1rem', letterSpacing: '1px' }}>{loading ? 'AUTHENTICATING...' : 'ESTABLISH LINK'}</span>
          </button>
        </form>

        {message && (
          <div className="login-message error" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
            {message}
          </div>
        )}

        <div className="login-footer">
          <div className="status-dot"></div>
          BIOMETRIC OVERRIDE STANDBY
        </div>
      </div>
    </div>
  );
};

export default Login;
