import React, { useState } from 'react';
import { UserInput, GeneratedResume, AppState } from './types';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import Login from './components/Login';
import { generateResumeContent } from './services/geminiService';
import { Sparkles, AlertCircle, LogOut, User as UserIcon } from 'lucide-react';

const initialInput: UserInput = {
  templateId: 'classic',
  photo: '',
  fullName: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  website: '',
  jobTitle: '',
  experienceLevel: 'Mid Level',
  skills: '',
  experience: '',
  education: [{
    id: '1',
    degree: '',
    school: '',
    startYear: (new Date().getFullYear() - 4).toString(),
    endYear: 'Present'
  }],
  projects: '',
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.EDITING);
  const [inputData, setInputData] = useState<UserInput>(initialInput);
  const [resumeData, setResumeData] = useState<GeneratedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const handleLogin = (identifier: string, type: 'email' | 'phone') => {
    setIsAuthenticated(true);
    setIsGuest(false);
    // Pre-fill data based on login
    setInputData(prev => ({
      ...prev,
      [type]: identifier
    }));
  };

  const handleGuestLogin = () => {
    setIsAuthenticated(true);
    setIsGuest(true);
    setInputData(initialInput);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsGuest(false);
    setAppState(AppState.EDITING);
    setInputData(initialInput);
    setResumeData(null);
    setError(null);
  };

  const handleGenerate = async () => {
    setAppState(AppState.GENERATING);
    setError(null);
    try {
      const result = await generateResumeContent(inputData);
      setResumeData(result);
      setAppState(AppState.VIEWING);
    } catch (err) {
      console.error(err);
      setError("Failed to generate resume. Please ensure all fields contain valid information and try again.");
      setAppState(AppState.EDITING);
    }
  };

  const handleEdit = () => {
    setAppState(AppState.EDITING);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Navbar - hidden on print */}
      <nav className="no-print bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Sparkles className="h-8 w-8 text-sky-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">Resume Architect</span>
            </div>
            <div className="flex items-center gap-4">
               {isGuest ? (
                 <span className="text-sm text-gray-500 flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                   <UserIcon className="w-4 h-4" /> Guest
                 </span>
               ) : (
                 <span className="text-sm text-sky-700 font-medium hidden sm:block">
                   {inputData.email || inputData.phone}
                 </span>
               )}
               <button 
                 onClick={handleLogout}
                 className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
               >
                 <LogOut className="w-4 h-4" />
                 <span className="hidden sm:inline">Logout</span>
               </button>
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

        {appState === AppState.EDITING || appState === AppState.GENERATING ? (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Build your perfect resume
              </h1>
              <p className="mt-3 text-lg text-gray-500">
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
      <footer className="no-print bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Resume Architect.</p>
          <p className="text-[10px] mt-2 opacity-60">Developed by Tanzim</p>
        </div>
      </footer>
    </div>
  );
}

export default App;