import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { ShieldCheck, Mail, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('✅ Magic Link sent! Check your email inbox.');
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
        <p className="login-subtitle">SECURE ACCESS PROTOCOL</p>
        <p className="login-desc">Enter your authorized email to receive a secure access link.</p>
        
        <form onSubmit={handleMagicLinkLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="login-input-wrapper">
             <Mail size={18} className="input-icon" />
             <input 
               type="email" 
               placeholder="ramsaiyenugadhati@gmail.com" 
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="login-input"
               required
             />
          </div>
          
          <button className="google-login-btn" type="submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
            <span>{loading ? 'Sending Link...' : 'Send Magic Link'}</span>
          </button>
        </form>

        {message && (
          <div className={`login-message ${message.startsWith('Error') ? 'error' : 'success'}`}>
             {message}
          </div>
        )}
        
        <div className="login-footer">
          <div className="status-dot"></div>
          ENCRYPTED CONNECTION ACTIVE
        </div>
      </div>
    </div>
  );
};

export default Login;
