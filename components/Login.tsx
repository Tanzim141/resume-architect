import React, { useState } from 'react';
import { Sparkles, LogIn, User, KeyRound, ArrowLeft, CheckCircle, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';

interface LoginProps {
  onLogin: (identifier: string, type: 'email' | 'phone') => void;
  onGuestLogin: () => void;
  onGoogleLogin: () => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGuestLogin, onGoogleLogin }) => {
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
      if (!supabase) throw new Error("Supabase is not configured.");
      
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700 relative">
          <button 
            onClick={() => switchView('login')}
            className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center mb-8 mt-2">
            <div className="flex justify-center mb-4">
              <div className="bg-sky-100 p-3 rounded-full">
                <KeyRound className="h-8 w-8 text-sky-600" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
              {resetStatus === 'success' 
                ? 'Check your inbox for instructions' 
                : 'Enter your email to receive reset instructions'}
            </p>
          </div>

          {resetStatus === 'success' ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Reset link sent successfully!</span>
              </div>
              <button
                onClick={() => switchView('login')}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="resetInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  id="resetInput"
                  value={resetIdentifier}
                  onChange={(e) => {
                    setResetIdentifier(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter your email or phone"
                />
                {error && <p className="mt-2 text-sm text-red-600 whitespace-pre-line">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={resetStatus === 'sending'}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {resetStatus === 'sending' ? (
                  <>Sending...</>
                ) : (
                  <>Send Reset Link</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: SIGN UP
  // ----------------------------------------------------------------------
  if (view === 'signup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">Join Resume Architect today</p>
          </div>

          <form onSubmit={handleSignupSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="signupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="signupIdentifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email or Mobile Number
              </label>
              <input
                type="text"
                id="signupIdentifier"
                value={signupIdentifier}
                onChange={(e) => {
                  setSignupIdentifier(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter your email or phone"
              />
            </div>

            <div>
              <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 whitespace-pre-line">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => switchView('login')}
                className="text-sky-600 hover:text-sky-700 font-semibold"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: LOGIN
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-sky-100 p-2.5 sm:p-3 rounded-full">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-sky-600" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">Sign in to Resume Architect to start building</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your email or phone"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => switchView('forgot-password')}
                className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium"
              >
                Forgot Password?
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
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 whitespace-pre-line">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
          >
            {isLoading ? (
              <>Loading...</>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>

          <div className="mt-4 text-center">
             <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchView('signup')}
                className="text-sky-600 hover:text-sky-700 font-semibold"
              >
                Sign Up
              </button>
            </p>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await onGoogleLogin();
                } catch (err) {
                  setError('Failed to sign in with Google');
                }
              }}
              className="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              className="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;