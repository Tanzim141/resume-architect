import React, { useState } from 'react';
import { LogIn, User, KeyRound, ArrowLeft, CheckCircle, UserPlus, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Logo } from './Logo';

interface LoginProps {
  onLogin: (identifier: string, type: 'email' | 'phone') => void;
  onGuestLogin: () => void;
  onGoogleLogin: () => Promise<void>;
  onClose?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGuestLogin, onGoogleLogin, onClose }) => {
  const { login, signup } = useAuth();
  const [view, setView] = useState<'login' | 'signup' | 'forgot-password'>('login');
  
  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupIdentifier, setSignupIdentifier] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Shared State
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'success'>('idle');


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setError('Please enter your email or mobile number');
      return;
    }
    
    if (!cleanPassword) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = cleanIdentifier.includes('@');
      await login(cleanIdentifier, cleanPassword, isEmail);
      onLogin(cleanIdentifier, isEmail ? 'email' : 'phone');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || '';
      if (errMsg.includes('Email not confirmed') || errMsg.includes('Email not verified')) {
        setError('Please check your email to confirm your account before logging in.');
      } else if (errMsg.includes('Invalid login credentials') || errMsg.includes('invalid_grant') || errMsg.includes('database error')) {
        setError('Invalid login credentials');
      } else if (err.status === 429 || errMsg.includes('rate limit')) {
        setError('Too many login attempts. Please try again later.');
      } else {
        const cleanMsg = errMsg.replace(/^Error (logging in|signing up):\s*/i, '');
        setError(cleanMsg || 'Failed to log in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = signupName.trim();
    const cleanIdentifier = signupIdentifier.trim();
    const cleanPassword = signupPassword.trim();

    if (!cleanName) {
      setError('Please enter your full name');
      return;
    }

    if (!cleanIdentifier) {
      setError('Please enter your email or mobile number');
      return;
    }

    if (!cleanPassword) {
      setError('Please create a password');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = cleanIdentifier.includes('@');
      await signup(cleanIdentifier, cleanPassword, cleanName, isEmail);
      
      // Auto login after successful signup
      onLogin(cleanIdentifier, isEmail ? 'email' : 'phone');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || '';
      if (errMsg.includes('already registered') || errMsg.includes('already-in-use') || err.status === 422) {
        setError('User already registered');
      } else if (errMsg.includes('Phone signups are disabled') || errMsg.includes('phone_provider_disabled') || (!cleanIdentifier.includes('@') && errMsg.includes('disabled'))) {
        setError('Phone signups are disabled');
      } else if (err.status === 429 || errMsg.includes('rate limit')) {
        setError('Too many registration attempts. Please try again later.');
      } else {
        const cleanMsg = errMsg.replace(/^Error (logging in|signing up):\s*/i, '');
        setError(cleanMsg || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = resetIdentifier.trim();

    if (!cleanIdentifier) {
       setError('Please enter your registered email or phone');
       return;
    }
    
    setResetStatus('sending');
    
    try {
      // NOTE: For phone, direct reset link doesn't work via email method, 
      // this part needs refinement in user flow if phone support is fully needed here.
      // Keeping it simple for now as per previous logic.
      const isEmail = cleanIdentifier.includes('@');
      
      if (!isEmail) {
        setError('Password reset is not available for phone number accounts. Please contact support.');
        setResetStatus('idle');
        return;
      }

      const { supabase } = await import('../supabase');
      if (!supabase) {
        // Local mode password reset notification
        setResetStatus('success');
        setError('');
        return;
      }
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanIdentifier, {
        redirectTo: window.location.origin
      });
      
      if (resetError) throw resetError;
      
      setResetStatus('success');
      setError('');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('User not found')) {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
      setResetStatus('idle');
    }
  };

  const switchView = (newView: 'login' | 'signup' | 'forgot-password') => {
    setView(newView);
    setError('');
    setResetStatus('idle');
    setResetIdentifier('');
    setShowPassword(false);
    // Clear form inputs when switching
    if (newView === 'login') {
      setSignupName('');
      setSignupIdentifier('');
      setSignupPassword('');
    } else if (newView === 'signup') {
      setIdentifier('');
      setPassword('');
    }
  };

  // ----------------------------------------------------------------------
  // VIEW: FORGOT PASSWORD
  // ----------------------------------------------------------------------
  if (view === 'forgot-password') {
    return (
      <div className="w-full max-w-[380px] mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700 relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={() => switchView('login')}
          className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="text-center mb-5 mt-1">
          <div className="flex justify-center mb-2.5">
            <div className="bg-sky-50 dark:bg-sky-950/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/50">
              <KeyRound className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {resetStatus === 'success' 
              ? 'Check your inbox for instructions' 
              : 'Enter your email to receive reset link'}
          </p>
        </div>

        {resetStatus === 'success' ? (
          <div className="text-center space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/40">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Reset link sent to your email!</span>
            </div>
            <button
              onClick={() => switchView('login')}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-xs"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <div>
              <label htmlFor="resetInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="resetInput"
                value={resetIdentifier}
                onChange={(e) => {
                  setResetIdentifier(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="name@example.com"
              />
              {error && <p className="mt-1.5 text-xs text-rose-600 whitespace-pre-line">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={resetStatus === 'sending'}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-70"
            >
              {resetStatus === 'sending' ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: SIGN UP
  // ----------------------------------------------------------------------
  if (view === 'signup') {
    return (
      <div className="w-full max-w-[380px] mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700 relative animate-in fade-in zoom-in-95 duration-200">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <Logo size="sm" showText={false} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Create Account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Start building your professional resume</p>
        </div>

        <form onSubmit={handleSignupSubmit} className="space-y-3">
          <div>
            <label htmlFor="signupName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="signupName"
              value={signupName}
              onChange={(e) => {
                setSignupName(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="e.g. Alex Morgan"
            />
          </div>

          <div>
            <label htmlFor="signupIdentifier" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email or Mobile
            </label>
            <input
              type="text"
              id="signupIdentifier"
              value={signupIdentifier}
              onChange={(e) => {
                setSignupIdentifier(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label htmlFor="signupPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="signupPassword"
                value={signupPassword}
                onChange={(e) => {
                  setSignupPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pr-9"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-800 whitespace-pre-line">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-70 mt-1"
          >
            {isLoading ? (
              'Creating account...'
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => switchView('login')}
              className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: LOGIN
  // ----------------------------------------------------------------------
  return (
    <div className="w-full max-w-[380px] mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700 relative animate-in fade-in zoom-in-95 duration-200">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="text-center mb-4">
        <div className="flex justify-center mb-2">
          <Logo size="sm" showText={false} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sign in to Resume Architect</p>
      </div>

      <form onSubmit={handleLoginSubmit} className="space-y-3">
        <div>
          <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email or Mobile Number
          </label>
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="Enter your email or phone"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <button
              type="button"
              onClick={() => switchView('forgot-password')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 font-medium"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pr-9"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-800 whitespace-pre-line">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-70 mt-1"
        >
          {isLoading ? (
            'Logging in...'
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Login
            </>
          )}
        </button>

        <div className="relative my-2.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-[11px]">
            <span className="px-2 bg-white dark:bg-slate-800 text-slate-400">Or continue with</span>
          </div>
        </div>

        {/* Side-by-side compact social buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await onGoogleLogin();
              } catch (err) {
                setError('Failed to sign in with Google');
              }
            }}
            className="w-full bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs shadow-xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={onGuestLogin}
            className="w-full bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs shadow-xs"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            Guest
          </button>
        </div>
      </form>

      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => switchView('signup')}
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;