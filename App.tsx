import React, { useState, useEffect, useRef } from 'react';
import { UserInput, GeneratedResume, AppState } from './types';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import Login from './components/Login';
import ChatBot from './components/ChatBot';
import { MyResumes } from './components/MyResumes';
import { generateResumeContent } from './services/geminiService';
import { Sparkles, AlertCircle, LogOut, User as UserIcon, List, Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { supabase } from './supabase';

const initialInput: UserInput = {
  templateId: 'classic',
  photo: 'https://api.dicebear.com/7.x/micah/svg?seed=Alex&backgroundColor=transparent',
  fullName: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '+1 234 567 8900',
  linkedin: 'linkedin.com/in/alexmorgan',
  github: 'github.com/alexmorgan',
  website: 'alexmorgan.dev',
  customLinks: [],
  jobTitle: 'Senior Software Engineer',
  experienceLevel: 'Mid Level',
  skills: '',
  experience: '',
  education: [{
    id: '1',
    degree: '',
    school: '',
    startYear: (new Date().getFullYear() - 4).toString(),
    endYear: 'Present',
    cgpa: ''
  }],
  projects: '',
};

function AppContent() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appState, setAppState] = useState<AppState | 'DASHBOARD'>('DASHBOARD');
  const [inputData, setInputData] = useState<UserInput>(initialInput);
  const [resumeData, setResumeData] = useState<GeneratedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync Supabase auth with local auth state
  React.useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      setIsGuest(false);
      setInputData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (identifier: string, type: 'email' | 'phone') => {
    setIsAuthenticated(true);
    setIsGuest(false);
    setInputData(prev => ({ ...prev, [type]: identifier }));
    setAppState('DASHBOARD');
  };

  const handleGuestLogin = () => {
    setIsAuthenticated(true);
    setIsGuest(true);
    setInputData(initialInput);
    setAppState(AppState.EDITING);
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    setAppState('DASHBOARD');
  };

  const handleLogout = async () => {
    if (!isGuest) {
      await logout();
    }
    setIsAuthenticated(false);
    setIsGuest(false);
    setAppState('DASHBOARD');
    setInputData(initialInput);
    setResumeData(null);
    setCurrentResumeId(null);
    setError(null);
  };

  const handleGenerate = async () => {
    setAppState(AppState.GENERATING);
    setError(null);
    let generatedResult: GeneratedResume | null = null;
    try {
      generatedResult = await generateResumeContent(inputData);
      setResumeData(generatedResult);
      setAppState(AppState.VIEWING);
    } catch (err) {
      console.error(err);
      setError("Failed to generate resume. Please ensure all fields contain valid information and try again.");
      setAppState(AppState.EDITING);
      return;
    }

    // Save to Database if logged in
    if (user && !isGuest && generatedResult) {
      try {
        if (currentResumeId) {
          const { error: updateError } = await supabase
            .from('resumes')
            .update({
              personalInfo: inputData,
              resumeData: generatedResult,
              createdAt: new Date().toISOString()
            })
            .eq('id', currentResumeId);
          if (updateError) throw updateError;
        } else {
          const { data, error: insertError } = await supabase
            .from('resumes')
            .insert([{
              uid: user.id,
              personalInfo: inputData,
              resumeData: generatedResult,
              createdAt: new Date().toISOString()
            }])
            .select('id')
            .single();
          if (insertError) throw insertError;
          if (data && data.id) {
            setCurrentResumeId(data.id);
          }
        }
      } catch (saveErr) {
        console.error("Failed to save resume:", saveErr);
      }
    }
  };

  const handleEdit = () => {
    setAppState(AppState.EDITING);
  };

  const handleLoadResume = (id: string, personalInfo: UserInput, resumeData: GeneratedResume) => {
    setCurrentResumeId(id);
    setInputData(personalInfo);
    setResumeData(resumeData);
    setAppState(AppState.VIEWING);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (!isAuthenticated && !user) {
    return <Login onLogin={handleLogin} onGuestLogin={handleGuestLogin} onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 print:bg-white transition-colors duration-200">
      {/* Navbar - hidden on print */}
      <nav className="no-print bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setAppState(isGuest ? AppState.EDITING : 'DASHBOARD')}>
              <Sparkles className="h-8 w-8 text-sky-600 dark:text-sky-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white tracking-tight">Resume Architect</span>
            </div>
            <div className="flex items-center gap-4">
               <button
                 onClick={() => setDarkMode(!darkMode)}
                 className="p-2 text-gray-500 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
               >
                 {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>
               {!isGuest && (
                 <button 
                   onClick={() => setAppState('DASHBOARD')}
                   className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
                 >
                   <List className="w-4 h-4" />
                   <span className="hidden sm:inline">My Resumes</span>
                 </button>
               )}
               {isGuest ? (
                 <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                   <UserIcon className="w-4 h-4" /> Guest
                 </span>
                ) : (
                  <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="text-sm text-sky-700 dark:text-sky-300 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      {user?.user_metadata?.full_name || 'User'}
                    </button>
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 truncate">
                          {user?.email}
                        </p>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium px-2 py-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
        
        {error && (
          <div className="no-print mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Error</h4>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {appState === 'DASHBOARD' ? (
          <MyResumes 
            onLoadResume={handleLoadResume} 
            onCreateNew={() => {
              setCurrentResumeId(null);
              setInputData(initialInput);
              setResumeData(null);
              setAppState(AppState.EDITING);
            }} 
            onBack={() => setAppState(resumeData ? AppState.VIEWING : AppState.EDITING)}
          />
        ) : appState === AppState.EDITING || appState === AppState.GENERATING ? (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                Build your perfect resume
              </h1>
              <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
                Choose a template, enter your details, and let AI structure your professional story.
              </p>
            </div>
            <ResumeForm 
              input={inputData} 
              setInput={setInputData} 
              onGenerate={handleGenerate}
              isGenerating={appState === AppState.GENERATING}
            />
          </div>
        ) : (
          resumeData && (
            <div className="animate-in slide-in-from-bottom-4 duration-700">
              <ResumePreview 
                data={resumeData} 
                personalInfo={inputData} 
                onEdit={handleEdit} 
              />
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 py-8 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-400 dark:text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Resume Architect.</p>
          <p className="mt-1 text-xs">Developed by Echo Planner</p>
        </div>
      </footer>
      
      {/* Global Widgets */}
      <ChatBot />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;