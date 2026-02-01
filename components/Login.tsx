import React, { useState } from 'react';
import { Sparkles, LogIn, User, KeyRound, ArrowLeft, CheckCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (identifier: string, type: 'email' | 'phone') => void;
  onGuestLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGuestLogin }) => {
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

  // Forgot password state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Helper to get users from local storage
  const getStoredUsers = () => {
    try {
      const users = localStorage.getItem('resume_app_users');
      return users ? JSON.parse(users) : {};
    } catch (e) {
      return {};
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
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

    // Check credentials against local storage
    const users = getStoredUsers();
    const user = users[cleanIdentifier];

    if (!user || user.password !== cleanPassword) {
      setError('Invalid email/mobile number or password. Please try again or Sign Up.');
      return;
    }

    const isEmail = cleanIdentifier.includes('@');
    onLogin(cleanIdentifier, isEmail ? 'email' : 'phone');
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
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

    // Check if user already exists
    const users = getStoredUsers();
    if (users[cleanIdentifier]) {
      setError('An account with this email/number already exists. Please Log In.');
      return;
    }

    // Save new user
    users[cleanIdentifier] = {
      name: cleanName,
      identifier: cleanIdentifier,
      password: cleanPassword
    };
    
    try {
      localStorage.setItem('resume_app_users', JSON.stringify(users));
      
      // Auto login after successful signup
      const isEmail = cleanIdentifier.includes('@');
      onLogin(cleanIdentifier, isEmail ? 'email' : 'phone');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = resetIdentifier.trim();

    if (!cleanIdentifier) {
       setError('Please enter your registered email or phone');
       return;
    }
    
    const users = getStoredUsers();
    if (!users[cleanIdentifier]) {
      setError('No account found with this email/number.');
      return;
    }

    setResetStatus('sending');
    
    // Simulate API call for password reset
    setTimeout(() => {
        setResetStatus('success');
        setError('');
    }, 1500);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100 relative">
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
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="text-gray-500 mt-2">
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
                <label htmlFor="resetInput" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Enter your email or phone"
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={resetStatus === 'sending'}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
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
        <div className="mt-8 text-center text-gray-400 text-xs">
          Developed by Tanzim
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: SIGN UP
  // ----------------------------------------------------------------------
  if (view === 'signup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <p className="text-gray-500 mt-2">Join Resume Architect today</p>
          </div>

          <form onSubmit={handleSignupSubmit} className="space-y-5">
            <div>
              <label htmlFor="signupName" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="signupIdentifier" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="Enter your email or phone"
              />
            </div>

            <div>
              <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400 pr-10"
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

            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-5 h-5" />
              Sign Up
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
        <div className="mt-8 text-center text-gray-400 text-xs">
          Developed by Tanzim
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: LOGIN
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-sky-100 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-sky-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to Resume Architect to start building</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter your email or phone"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => switchView('forgot-password')}
                className="text-sm text-sky-600 hover:text-sky-700 font-medium"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400 pr-10"
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

          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-5 h-5" />
            Login
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
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGuestLogin}
            className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Continue as Guest
          </button>
        </form>
      </div>
      <div className="mt-8 text-center text-gray-400 text-xs">
        Developed by Tanzim
      </div>
    </div>
  );
};

export default Login;