import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AuthPageShell, AuthLogo, AuthInput, AuthButton } from '../components/auth';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1100);
  };

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <AuthPageShell>
      <div className="relative w-full max-w-[400px] dropin-fadein">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 mb-5 text-sm font-medium transition-all duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--burnt-orange)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <AuthLogo />

          {!sent ? (
            <div className="dropin-fadein">
              <div className="mb-7">
                <p className="section-label mb-0.5">account recovery</p>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Reset your password</h1>
                <p className="font-body text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Enter your email and we'll send you a secure reset link.
                </p>
              </div>

              <div className="mb-5">
                <AuthInput
                  label="Email address" id="fp-email" type="email"
                  placeholder="you@example.com"
                  value={email} onChange={v => { setEmail(v); setError(''); }}
                  icon={Mail} error={error} autoComplete="email"
                />
              </div>

              <AuthButton onClick={handleSubmit} loading={loading}>
                Send Reset Link
              </AuthButton>
            </div>
          ) : (
            <div className="dropin-fadein text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(45,125,70,0.10)' }}
              >
                <CheckCircle2 size={32} style={{ color: '#2D7D46' }} />
              </div>

              <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                Check your inbox
              </h2>
              <p className="font-body text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                We sent a reset link to
              </p>
              <p className="font-semibold text-sm mb-6" style={{ color: 'var(--burnt-orange)' }}>{email}</p>

              <div
                className="rounded-xl p-4 mb-6 text-left"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              >
                <p className="font-mono text-[10px] uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>// next steps</p>
                {[
                  'Open the email from dropin.bot',
                  'Click the "Reset Password" link',
                  'Choose a new secure password',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-[10px] font-bold"
                      style={{ background: 'rgba(192,86,64,0.10)', color: 'var(--burnt-orange)' }}
                    >
                      {i + 1}
                    </span>
                    <p className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>{step}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleResend}
                disabled={resent}
                className="flex items-center gap-2 mx-auto text-sm font-medium transition-all duration-200"
                style={{ color: resent ? 'var(--text-muted)' : 'var(--burnt-orange)', cursor: resent ? 'default' : 'pointer' }}
              >
                <RefreshCw size={14} style={{ animation: resent ? 'dropin-spin 1s linear' : 'none' }} />
                {resent ? 'Sent!' : "Didn't receive it? Resend"}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full mt-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.color = 'var(--burnt-orange)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthPageShell>
  );
}
