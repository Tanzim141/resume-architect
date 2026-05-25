import React, { useState } from 'react';
import { UserInput, TemplateId, GeneratedResume } from '../types';
import { Briefcase, GraduationCap, Code, User, FileText, Github, Globe, Layout, Image as ImageIcon, Plus, Trash2, Eye, X } from 'lucide-react';
import ResumePreview from './ResumePreview';

interface ResumeFormProps {
  input: UserInput;
  setInput: React.Dispatch<React.SetStateAction<UserInput>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const dummyInput: UserInput = {
  templateId: 'classic',
  fullName: 'Alex Morgan',
  jobTitle: 'Senior Software Engineer',
  email: 'alex.morgan@example.com',
  phone: '+1 234 567 8900',
  linkedin: 'linkedin.com/in/alexmorgan',
  github: 'github.com/alexmorgan',
  website: 'alexmorgan.dev',
  experienceLevel: 'Senior Level',
  skills: '',
  experience: '',
  education: [],
  projects: '',
  photo: 'https://api.dicebear.com/7.x/micah/svg?seed=Alex&backgroundColor=transparent'
};

const dummyData: GeneratedResume = {
  professionalSummary: 'Experienced software engineer with a passion for developing innovative programs that expedite the efficiency and effectiveness of organizational success. Well-versed in technology and writing code to create systems that are reliable and user-friendly.',
  workExperience: [
    {
      role: 'Senior Developer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      duration: '2020 - Present',
      points: [
        'Led a team of 5 developers to create a new e-commerce platform.',
        'Improved application performance by 30% through code optimization.',
        'Implemented CI/CD pipelines reducing deployment time by 50%.'
      ]
    },
    {
      role: 'Software Engineer',
      company: 'Web Solutions Inc',
      location: 'New York, NY',
      duration: '2017 - 2020',
      points: [
        'Developed and maintained multiple client websites using React and Node.js.',
        'Collaborated with designers to implement responsive UI/UX designs.',
        'Integrated third-party APIs for payment processing and analytics.'
      ]
    }
  ],
  skills: [
    {
      category: 'Frontend',
      items: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js']
    },
    {
      category: 'Backend',
      items: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB']
    }
  ],
  education: [
    {
      degree: 'B.S. Computer Science',
      institution: 'University of Technology',
      location: 'Boston, MA',
      year: '2013 - 2017',
      cgpa: '3.8/4.0',
      scoreType: 'CGPA'
    }
  ],
  projects: [
    {
      name: 'E-commerce Dashboard',
      description: 'A comprehensive dashboard for managing online store inventory and sales.',
      technologies: ['React', 'Redux', 'Material UI']
    }
  ]
};

const ResumeForm: React.FC<ResumeFormProps> = ({ input, setInput, onGenerate, isGenerating }) => {
  const [previewTemplate, setPreviewTemplate] = useState<TemplateId | null>(null);

  const handleChange = (field: keyof UserInput, value: any) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const addCustomLink = () => {
    setInput(prev => ({
      ...prev,
      customLinks: [...(prev.customLinks || []), { id: crypto.randomUUID(), name: '', url: '' }]
    }));
  };

  const updateCustomLink = (id: string, field: 'name' | 'url', value: string) => {
    setInput(prev => ({
      ...prev,
      customLinks: (prev.customLinks || []).map(link => 
        link.id === id ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeCustomLink = (id: string) => {
    setInput(prev => ({
      ...prev,
      customLinks: (prev.customLinks || []).filter(link => link.id !== id)
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('photo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    handleChange('photo', '');
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updatedEdu = [...input.education];
    updatedEdu[index] = { ...updatedEdu[index], [field]: value };
    setInput(prev => ({ ...prev, education: updatedEdu }));
  };

  const addEducationField = () => {
    setInput(prev => ({
      ...prev,
      education: [
        ...prev.education, 
        { 
          id: Date.now().toString(), 
          degree: '', 
          school: '', 
          startYear: (new Date().getFullYear() - 4).toString(), 
          endYear: 'Present',
          cgpa: '',
          scoreType: 'CGPA'
        }
      ]
    }));
  };

  const removeEducationField = (index: number) => {
    if (input.education.length > 1) {
      const updatedEdu = input.education.filter((_, i) => i !== index);
      setInput(prev => ({ ...prev, education: updatedEdu }));
    } else {
        // If only one exists, just clear it instead of removing
        const updatedEdu = [...input.education];
        updatedEdu[0] = { ...updatedEdu[0], degree: '', school: '' };
        setInput(prev => ({ ...prev, education: updatedEdu }));
    }
  };

  const inputClasses = "w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";
  const textareaClasses = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-y text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";

  // Generate years for dropdown (1990 - 2050)
  const years = Array.from({ length: 2050 - 1990 + 1 }, (_, i) => 2050 - i);

  const templates: { id: TemplateId; name: string; desc: string }[] = [
    { id: 'classic', name: 'Classic ATS', desc: 'Clean, text-focused, best for parsing.' },
    { id: 'modern', name: 'Modern Columns', desc: 'Split layout, sleek and professional.' },
    { id: 'creative', name: '3D Creative', desc: 'Visual profile with photo & depth.' },
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="bg-sky-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" /> Resume Builder
        </h2>
        <p className="text-sky-50 mt-2">Enter your raw details, and our AI will structure and polish them into a professional resume.</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Template Selection */}
        <section>
          <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
            <Layout className="w-5 h-5 text-sky-500" /> Select Template
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => handleChange('templateId', t.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  input.templateId === t.id
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 ring-1 ring-sky-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-sky-200 dark:hover:border-sky-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="font-bold text-gray-900 dark:text-white">{t.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.desc}</div>
                <div className="flex justify-between items-center mt-3">
                  {input.templateId === t.id ? (
                    <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400"></span> Selected
                    </div>
                  ) : <div />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(t.id);
                    }}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-1 font-medium bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded border border-sky-100 dark:border-sky-800 transition-colors"
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-gray-100 dark:border-gray-700" />

        {/* Personal Info */}
        <section>
          <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
            <User className="w-5 h-5 text-sky-500" /> Personal Details
          </h3>
          
          <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
             <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  {input.photo ? (
                    <img src={input.photo} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Photo {input.templateId === 'creative' ? '(Recommended)' : '(Optional)'}
                  </label>
                  <div className="flex gap-2">
                    <label className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      Upload Image
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                    {input.photo && (
                      <button 
                        onClick={removePhoto}
                        className="text-red-500 hover:text-red-700 text-sm font-medium px-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Recommended for Creative/3D templates</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Full Name</label>
              <input
                type="text"
                value={input.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={inputClasses}
                placeholder="Alex Morgan"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Target Job Title</label>
              <input
                type="text"
                value={input.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                className={inputClasses}
                placeholder="Senior Software Engineer"
              />
            </div>
             <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Experience Level</label>
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
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Email</label>
              <input
                type="email"
                value={input.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClasses}
                placeholder="alex.morgan@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Phone</label>
              <input
                type="text"
                value={input.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClasses}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400">LinkedIn <span className="text-gray-400 font-normal">(Optional)</span></label>
              <input
                type="text"
                value={input.linkedin}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                className={inputClasses}
                placeholder="linkedin.com/in/alexmorgan"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400 flex items-center gap-1">
                 <Github className="w-3 h-3" /> GitHub <span className="text-gray-400 font-normal">(Optional)</span>
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
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400 flex items-center gap-1">
                 <Globe className="w-3 h-3" /> Portfolio / Website <span className="text-gray-400 font-normal">(Optional)</span>
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
          
          {/* Custom Links section */}
          <div className="mt-4 space-y-3">
            {input.customLinks?.map((link) => (
              <div key={link.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) => updateCustomLink(link.id, 'name', e.target.value)}
                    className={inputClasses}
                    placeholder="Link Name (e.g., Behance)"
                  />
                </div>
                <div className="flex-[2] space-y-1">
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)}
                    className={inputClasses}
                    placeholder="URL"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCustomLink(link.id)}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent mt-0.5"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCustomLink}
              className="flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add custom link
            </button>
          </div>
        </section>

        <hr className="border-gray-100 dark:border-gray-700" />

        {/* Experience */}
        <section>
          <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
            <Briefcase className="w-5 h-5 text-sky-500" /> Work Experience
          </h3>
          <div className="space-y-1">
            <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Paste your work history (roles, dates, duties)</label>
            <textarea
              value={input.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              className={`${textareaClasses} h-40`}
              placeholder="e.g. Software Engineer at Google (2020-Present). Built React apps. Improved performance by 20%..."
            />
            <p className="text-xs text-gray-500">Don't worry about formatting. Just dump the text here.</p>
          </div>
        </section>

        <hr className="border-gray-100 dark:border-gray-700" />

        {/* Skills */}
        <section>
          <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
            <Code className="w-5 h-5 text-sky-500" /> Skills
          </h3>
          <div className="space-y-1">
            <label className="text-sm font-medium text-sky-700 dark:text-sky-400">List your skills</label>
            <textarea
              value={input.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
              className={`${textareaClasses} h-24`}
              placeholder="React, TypeScript, Node.js, Leadership, Project Management, Figma..."
            />
          </div>
        </section>

        <hr className="border-gray-100 dark:border-gray-700" />

        {/* Education & Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
              <GraduationCap className="w-5 h-5 text-sky-500" /> Education
            </h3>
            
            <div className="space-y-4">
              {input.education.map((edu, index) => (
                <div key={edu.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 relative">
                  {input.education.length > 1 && (
                     <button 
                        onClick={() => removeEducationField(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                        title="Remove"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  )}
                  
                  <div className="space-y-2">
                     <input 
                        type="text" 
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Degree (e.g. B.Sc in CS)"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                     />
                     <input 
                        type="text" 
                        value={edu.school}
                        onChange={(e) => updateEducation(index, 'school', e.target.value)}
                        placeholder="Institution (e.g. Dhaka University)"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                     />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                     <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Start Year</label>
                        <select
                           value={edu.startYear}
                           onChange={(e) => updateEducation(index, 'startYear', e.target.value)}
                           className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                           {years.map(year => (
                              <option key={`start-${edu.id}-${year}`} value={year}>{year}</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">End Year</label>
                        <select
                           value={edu.endYear}
                           onChange={(e) => updateEducation(index, 'endYear', e.target.value)}
                           className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                           <option value="Present">Present</option>
                           {years.map(year => (
                              <option key={`end-${edu.id}-${year}`} value={year}>{year}</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Score (Optional)</label>
                        <div className="flex gap-2">
                           <select
                              value={edu.scoreType || 'CGPA'}
                              onChange={(e) => updateEducation(index, 'scoreType', e.target.value)}
                              className="w-1/3 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           >
                              <option value="CGPA">CGPA</option>
                              <option value="GPA">GPA</option>
                           </select>
                           <input 
                              type="text" 
                              value={edu.cgpa || ''}
                              onChange={(e) => updateEducation(index, 'cgpa', e.target.value)}
                              placeholder="e.g. 3.8/4.0"
                              className="w-2/3 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                           />
                        </div>
                     </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addEducationField}
                className="w-full py-2 bg-white dark:bg-gray-800 border border-dashed border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 font-medium rounded hover:bg-sky-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" /> Add Another Education
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
              <Code className="w-5 h-5 text-sky-500" /> Projects (Optional)
            </h3>
            <div className="space-y-1">
              <label className="text-sm font-medium text-sky-700 dark:text-sky-400">List key projects</label>
              <textarea
                value={input.projects}
                onChange={(e) => handleChange('projects', e.target.value)}
                className={`${textareaClasses} h-32`}
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

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm">
          <div className="bg-gray-100 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-600" /> Template Preview
              </h3>
              <button 
                onClick={() => setPreviewTemplate(null)} 
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-gray-200/50">
              <div className="transform origin-top w-full max-w-[21cm]">
                <ResumePreview 
                  data={dummyData} 
                  personalInfo={{ ...dummyInput, templateId: previewTemplate }} 
                  onEdit={() => {}} 
                  hideActions={true} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForm;