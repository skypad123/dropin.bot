import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  AuthPageShell, AuthLogo, SSOButtons, OrDivider, AuthInput, PasswordStrength, AuthButton,
} from '../components/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signUp, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  /* ── Sign In state ── */
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw] = useState(false);
  const [siLoading, setSiLoading] = useState<string | null>(null);
  const [siErrors, setSiErrors] = useState<Record<string, string>>({});

  const validateSignIn = () => {
    const errs: Record<string, string> = {};
    if (!siEmail.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siEmail)) errs.email = 'Enter a valid email address.';
    if (!siPassword) errs.password = 'Password is required.';
    setSiErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = () => {
    if (!validateSignIn()) return;
    setSiLoading('email');
    setTimeout(() => { login('email', siEmail); }, 1000);
  };

  const handleSSOSignIn = (provider: string) => {
    setSiLoading(provider);
    setTimeout(() => { login(provider); }, 1200);
  };

  /* ── Sign Up state ── */
  const [suName, setSuName] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suShowPw, setSuShowPw] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);
  const [suLoading, setSuLoading] = useState<string | null>(null);
  const [suErrors, setSuErrors] = useState<Record<string, string>>({});

  const validateSignUp = () => {
    const errs: Record<string, string> = {};
    if (!suName.trim()) errs.name = 'Full name is required.';
    if (!suEmail.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail)) errs.email = 'Enter a valid email address.';
    if (suPhone && !/^[+\d\s\-().]{7,20}$/.test(suPhone)) errs.phone = 'Enter a valid phone number.';
    if (!suPassword) errs.password = 'Password is required.';
    else if (suPassword.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!suConfirm) errs.confirm = 'Please confirm your password.';
    else if (suConfirm !== suPassword) errs.confirm = 'Passwords do not match.';
    setSuErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignUp = () => {
    if (!validateSignUp()) return;
    setSuLoading('email');
    setTimeout(() => { signUp({ name: suName, email: suEmail, phone: suPhone || undefined, provider: 'email' }); }, 1000);
  };

  const handleSSOSignUp = (provider: string) => {
    setSuLoading(provider);
    setTimeout(() => { signUp({ name: '', email: '', provider }); }, 1200);
  };

  return (
    <AuthPageShell>
      <div className="relative w-full max-w-[420px] dropin-fadein">
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <AuthLogo />

          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 mb-7"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
          >
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: tab === t ? 'var(--bg-surface)' : 'transparent',
                  color: tab === t ? 'var(--burnt-orange)' : 'var(--text-muted)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                  border: tab === t ? '1px solid var(--border-color)' : '1px solid transparent',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ── SIGN IN ── */}
          {tab === 'signin' && (
            <div className="dropin-fadein">
              <div className="mb-6">
                <p className="section-label mb-0.5">welcome back</p>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Sign in to your dashboard</h1>
                <p className="font-body text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your OpenClaw bot instances</p>
              </div>

              <SSOButtons loading={siLoading} onSSO={handleSSOSignIn} />
              <OrDivider />

              <div className="space-y-4">
                <AuthInput
                  label="Email address" id="si-email" type="email"
                  placeholder="you@example.com" value={siEmail} onChange={setSiEmail}
                  icon={Mail} error={siErrors.email} autoComplete="email"
                />
                <AuthInput
                  label="Password" id="si-password"
                  type={siShowPw ? 'text' : 'password'}
                  placeholder="••••••••" value={siPassword} onChange={setSiPassword}
                  icon={Lock} error={siErrors.password} autoComplete="current-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setSiShowPw(v => !v)}
                      className="transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {siShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              <div className="flex justify-end mt-2 mb-5">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="font-body text-xs transition-colors duration-150"
                  style={{ color: 'var(--burnt-orange)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Forgot password?
                </button>
              </div>

              <AuthButton onClick={handleSignIn} loading={siLoading === 'email'} disabled={siLoading !== null && siLoading !== 'email'}>
                Sign In
              </AuthButton>

              <p className="font-body text-sm text-center mt-5" style={{ color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => setTab('signup')}
                  className="font-semibold inline-flex items-center gap-1 transition-opacity duration-150"
                  style={{ color: 'var(--burnt-orange)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Sign Up <ArrowRight size={14} />
                </button>
              </p>
            </div>
          )}

          {/* ── SIGN UP ── */}
          {tab === 'signup' && (
            <div className="dropin-fadein">
              <div className="mb-6">
                <p className="section-label mb-0.5">create account</p>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Get started for free</h1>
                <p className="font-body text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Deploy your first bot in minutes</p>
              </div>

              <SSOButtons loading={suLoading} onSSO={handleSSOSignUp} />
              <OrDivider label="or sign up with email" />

              <div className="space-y-4">
                <AuthInput
                  label="Full name" id="su-name" placeholder="Jane Smith"
                  value={suName} onChange={setSuName}
                  icon={User} error={suErrors.name} autoComplete="name"
                />
                <AuthInput
                  label="Phone number (optional)" id="su-phone" type="tel"
                  placeholder="+1 555 000 0000"
                  value={suPhone} onChange={setSuPhone}
                  icon={Phone} error={suErrors.phone} autoComplete="tel"
                />
                <AuthInput
                  label="Email address" id="su-email" type="email"
                  placeholder="you@example.com"
                  value={suEmail} onChange={setSuEmail}
                  icon={Mail} error={suErrors.email} autoComplete="email"
                />
                <div>
                  <AuthInput
                    label="Password" id="su-password"
                    type={suShowPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={suPassword} onChange={setSuPassword}
                    icon={Lock} error={suErrors.password} autoComplete="new-password"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setSuShowPw(v => !v)}
                        className="transition-colors duration-150"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        {suShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <PasswordStrength password={suPassword} />
                </div>
                <AuthInput
                  label="Confirm password" id="su-confirm"
                  type={suShowConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={suConfirm} onChange={setSuConfirm}
                  icon={Lock} error={suErrors.confirm} autoComplete="new-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setSuShowConfirm(v => !v)}
                      className="transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--burnt-orange)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {suShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              <div className="mt-6">
                <AuthButton onClick={handleSignUp} loading={suLoading === 'email'} disabled={suLoading !== null && suLoading !== 'email'}>
                  Create Account
                </AuthButton>
              </div>

              <p className="font-body text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
                By creating an account you agree to our{' '}
                <a href="#" style={{ color: 'var(--burnt-orange)' }} className="underline underline-offset-2">Terms</a>
                {' '}and{' '}
                <a href="#" style={{ color: 'var(--burnt-orange)' }} className="underline underline-offset-2">Privacy Policy</a>.
              </p>

              <p className="font-body text-sm text-center mt-4" style={{ color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <button
                  onClick={() => setTab('signin')}
                  className="font-semibold transition-opacity duration-150"
                  style={{ color: 'var(--burnt-orange)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Sign In
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthPageShell>
  );
}
