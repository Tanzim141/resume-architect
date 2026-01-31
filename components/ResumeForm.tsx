import React, { useState } from 'react';
import { UserInput } from '../types';
import { Briefcase, GraduationCap, Code, User, FileText, Github, Globe, Trash2, Plus } from 'lucide-react';

interface ResumeFormProps {
  input: UserInput;
  setInput: React.Dispatch<React.SetStateAction<UserInput>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ResumeForm: React.FC<ResumeFormProps> = ({ input, setInput, onGenerate, isGenerating }) => {
  const [newEdu, setNewEdu] = useState({ degree: '', school: '', year: new Date().getFullYear().toString() });

  const handleChange = (field: keyof UserInput, value: any) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddEducation = () => {
    if (newEdu.degree.trim() && newEdu.school.trim()) {
      setInput(prev => ({
        ...prev,
        education: [...prev.education, { ...newEdu, id: Date.now().toString() }]
      }));
      setNewEdu({ degree: '', school: '', year: new Date().getFullYear().toString() });
    }
  };

  const handleRemoveEducation = (id: string) => {
    setInput(prev => ({
      ...prev,
      education: prev.education.filter(e => e.id !== id)
    }));
  };

  const inputClasses = "w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-gray-50 text-gray-900 placeholder-gray-400";
  const textareaClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-y text-sm bg-gray-50 text-gray-900 placeholder-gray-400";

  // Generate years for dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear + 5) - i);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-sky-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" /> Resume Builder
        </h2>
        <p className="text-sky-50 mt-2">Enter your raw details, and our AI will structure and polish them into a professional resume.</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Personal Info */}
        <section>
          <h3 className="text-lg font-bold text-sky-700 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" /> Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700">Full Name</label>
              <input
                type="text"
                value={input.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={inputClasses}
                placeholder="Alex Morgan"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700">Target Job Title</label>
              <input
                type="text"
                value={input.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                className={inputClasses}
                placeholder="Senior Software Engineer"
              />
            </div>
             <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700">Experience Level</label>
              <select
                value={input.experienceLevel}
                onChange={(e) => handleChange('experienceLevel', e.target.value)}
                className={`${inputClasses} appearance-none`}
              >
                <option value="Entry Level">Entry Level (0-2 years)</option>
                <option value="Mid Level">Mid Level (3-5 years)</option>
                <option value="Senior Level">Senior Level (5-10 years)</option>
                <option value="Executive">Executive (10+ years)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700">Email</label>
              <input
                type="email"
                value={input.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClasses}
                placeholder="alex.morgan@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700">Phone</label>
              <input
                type="text"
                value={input.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClasses}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700">LinkedIn</label>
              <input
                type="text"
                value={input.linkedin}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                className={inputClasses}
                placeholder="linkedin.com/in/alexmorgan"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 flex items-center gap-1">
                 <Github className="w-3 h-3" /> GitHub
              </label>
              <input
                type="text"
                value={input.github}
                onChange={(e) => handleChange('github', e.target.value)}
                className={inputClasses}
                placeholder="github.com/alexmorgan"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 flex items-center gap-1">
                 <Globe className="w-3 h-3" /> Portfolio / Website
              </label>
              <input
                type="text"
                value={input.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className={inputClasses}
                placeholder="alexmorgan.dev"
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Experience */}
        <section>
          <h3 className="text-lg font-bold text-sky-700 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sky-500" /> Work Experience
          </h3>
          <div className="space-y-1">
            <label className="text-sm font-medium text-sky-700">Paste your work history (roles, dates, duties)</label>
            <textarea
              value={input.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              className={`${textareaClasses} h-40`}
              placeholder="e.g. Software Engineer at Google (2020-Present). Built React apps. Improved performance by 20%..."
            />
            <p className="text-xs text-gray-500">Don't worry about formatting. Just dump the text here.</p>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Skills */}
        <section>
          <h3 className="text-lg font-bold text-sky-700 mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-sky-500" /> Skills
          </h3>
          <div className="space-y-1">
            <label className="text-sm font-medium text-sky-700">List your skills</label>
            <textarea
              value={input.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
              className={`${textareaClasses} h-24`}
              placeholder="React, TypeScript, Node.js, Leadership, Project Management, Figma..."
            />
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Education & Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h3 className="text-lg font-bold text-sky-700 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-sky-500" /> Education
            </h3>
            
            <div className="space-y-3">
              {/* Added Education List */}
              {input.education.length > 0 && (
                <div className="space-y-2 mb-4">
                  {input.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-center bg-sky-50 p-3 rounded-lg border border-sky-100">
                      <div>
                        <p className="font-semibold text-sm text-sky-900">{edu.degree}</p>
                        <p className="text-xs text-sky-700">{edu.school} • {edu.year}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveEducation(edu.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Education Form */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                <input 
                  type="text" 
                  value={newEdu.degree}
                  onChange={(e) => setNewEdu(prev => ({ ...prev, degree: e.target.value }))}
                  placeholder="Degree (e.g. B.Sc in CS)"
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-gray-50 text-gray-900 placeholder-gray-400"
                />
                <input 
                  type="text" 
                  value={newEdu.school}
                  onChange={(e) => setNewEdu(prev => ({ ...prev, school: e.target.value }))}
                  placeholder="Institution (e.g. Dhaka University)"
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-gray-50 text-gray-900 placeholder-gray-400"
                />
                <select
                  value={newEdu.year}
                  onChange={(e) => setNewEdu(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-gray-50 text-gray-900"
                >
                   <option value="Present">Present / Expected</option>
                   {years.map(year => (
                     <option key={year} value={year}>{year}</option>
                   ))}
                </select>
                <button 
                  onClick={handleAddEducation}
                  disabled={!newEdu.degree || !newEdu.school}
                  className="w-full py-2 bg-sky-100 text-sky-700 font-medium rounded hover:bg-sky-200 transition-colors flex items-center justify-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Add Education
                </button>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-sky-700 mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-sky-500" /> Projects (Optional)
            </h3>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700">List key projects</label>
              <textarea
                value={input.projects}
                onChange={(e) => handleChange('projects', e.target.value)}
                className={`${textareaClasses} h-[17.5rem]`}
                placeholder="E-commerce website: Built with Next.js and Stripe..."
              />
            </div>
          </section>
        </div>

        <div className="pt-6">
          <button
            onClick={onGenerate}
            disabled={isGenerating || !input.fullName || !input.experience}
            className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-lg transform transition-all 
              ${isGenerating || !input.fullName || !input.experience
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 hover:-translate-y-0.5'
              } flex items-center justify-center gap-2`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Drafting your Resume...
              </>
            ) : (
              'Generate Professional Resume'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeForm;