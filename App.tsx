import React, { useState, useEffect, useRef } from 'react';
import { UserInput, GeneratedResume, AppState } from './types';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import Login from './components/Login';
import { MyResumes } from './components/MyResumes';
import { generateResumeContent } from './services/geminiService';
import { AlertCircle, LogOut, User as UserIcon, List, Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { supabase } from './supabase';
import { Logo } from './components/Logo';

const initialInput: UserInput = {
  templateId: 'classic',
  photo: 'https://api.dicebear.com/7.x/micah/svg?seed=Alex&backgroundColor=transparent',
  showPhotoInClassic: true,
  fullName: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  website: '',
  customLinks: [],
  jobTitle: '',
  experienceLevel: 'Entry Level',
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
  const [appState, setAppState] = useState<AppState | 'DASHBOARD'>(AppState.EDITING);
  const [inputData, setInputData] = useState<UserInput>(initialInput);
  const [resumeData, setResumeData] = useState<GeneratedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
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
      setInputData(prev => ({ ...prev, email: user.email || prev.email }));
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
    setShowLoginModal(false);
    setInputData(prev => ({ ...prev, [type]: identifier }));
  };

  const handleGuestLogin = () => {
    setIsAuthenticated(false);
    setShowLoginModal(false);
    setAppState(AppState.EDITING);
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setShowProfileMenu(false);
    setAppState(AppState.EDITING);
  };

  const handleGenerate = async () => {
    setAppState(AppState.GENERATING);
    setError(null);
    let generatedResult: GeneratedResume | null = null;
    try {
      generatedResult = await generateResumeContent(inputData);
      setResumeData(generatedResult);
      setAppState(AppState.VIEWING);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate resume. Please ensure all fields contain valid information and try again.");
      setAppState(AppState.EDITING);
      return;
    }

    // Save to Database (if logged in & supabase connected) or Local Storage (for everyone)
    if (generatedResult) {
      const currentUserId = user?.id || 'guest';
      if (user && supabase) {
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
          console.error("Failed to save resume to Supabase, saving locally:", saveErr);
        }
      }

      // Always update local cache as well
      try {
        const storageKey = `resumearchitect_saved_resumes_${currentUserId}`;
        const raw = localStorage.getItem(storageKey);
        let list: any[] = raw ? JSON.parse(raw) : [];
        if (currentResumeId) {
          list = list.map(item => item.id === currentResumeId ? {
            ...item,
            personalInfo: inputData,
            resumeData: generatedResult,
            createdAt: new Date().toISOString()
          } : item);
        } else {
          const newId = 'resume_' + Date.now();
          list.unshift({
            id: newId,
            uid: currentUserId,
            personalInfo: inputData,
            resumeData: generatedResult,
            createdAt: new Date().toISOString()
          });
          setCurrentResumeId(newId);
        }
        localStorage.setItem(storageKey, JSON.stringify(list));
      } catch (e) {
        console.error("Failed to save resume locally:", e);
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 print:bg-white transition-colors duration-200">
      {/* Navbar - hidden on print */}
      <nav className="no-print bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200 w-full">
        <div className="max-w-5xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-1">
            <div 
              className="flex items-center cursor-pointer select-none shrink min-w-0 pr-1 transition-opacity hover:opacity-90 active:scale-98" 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                document.body.scrollTo({ top: 0, behavior: 'smooth' });
                setAppState(AppState.EDITING);
              }}
              title="Back to Top / Home"
            >
              <Logo size="md" />
            </div>
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
               <button
                 onClick={() => setDarkMode(!darkMode)}
                 className="p-1.5 text-gray-500 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                 title="Toggle Theme"
                 aria-label="Toggle Theme"
               >
                 {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
               </button>

               <button 
                 onClick={() => setAppState(appState === 'DASHBOARD' ? (resumeData ? AppState.VIEWING : AppState.EDITING) : 'DASHBOARD')}
                 className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium p-1.5 sm:px-3 sm:py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                   appState === 'DASHBOARD'
                     ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                     : 'text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                 }`}
                 title="My Resumes"
               >
                 <List className="w-4 h-4 shrink-0" />
                 <span className="hidden sm:inline">My Resumes</span>
               </button>

               {user ? (
                  <div className="relative shrink-0" ref={menuRef}>
                    <button 
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="text-xs sm:text-sm text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1 bg-sky-50 dark:bg-sky-950 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 cursor-pointer shrink-0"
                    >
                      <UserIcon className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span className="max-w-[70px] sm:max-w-[120px] truncate hidden xs:inline">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account'}</span>
                    </button>
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 truncate">
                          {user?.email || user?.phone}
                        </p>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
                  >
                    Sign In
                  </button>
                )}
            </div>
          </div>
        </div>
      </nav>

      {/* Optional Login Modal */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLoginModal(false);
          }}
        >
          <div className="w-full max-w-[380px] my-auto">
            <Login 
              onLogin={handleLogin} 
              onGuestLogin={handleGuestLogin} 
              onGoogleLogin={handleGoogleLogin} 
              onClose={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 print:p-0 print:max-w-none">
        
        {error && (
          <div className="no-print mb-4 sm:mb-6 p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm sm:text-base">Error</h4>
              <p className="text-xs sm:text-sm">{error}</p>
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
            <div className="mb-4 sm:mb-6 text-center px-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Build your perfect resume
              </h1>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
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

      {/* Footer - Only on Home page */}
      {(appState === AppState.EDITING || appState === AppState.GENERATING) && (
        <footer className="no-print bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 py-8 transition-colors duration-200">
          <div className="max-w-5xl mx-auto px-4 text-center text-gray-400 dark:text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Resume Architect.</p>
            <p className="mt-1 text-xs">Developed by Echo Planner</p>
          </div>
        </footer>
      )}
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