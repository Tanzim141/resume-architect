import React, { useState } from 'react';
import { GeneratedResume, UserInput } from '../types';
import { Mail, Phone, Link as LinkIcon, Download, ArrowLeft, FileText, Loader2, Github, Globe } from 'lucide-react';

interface ResumePreviewProps {
  data: GeneratedResume;
  personalInfo: UserInput;
  onEdit: () => void;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, personalInfo, onEdit }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    const element = document.getElementById('resume-preview-content');
    
    if (element && window.html2pdf) {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.zIndex = '9999';
      container.style.backgroundColor = 'white';
      container.style.overflowY = 'scroll';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'flex-start';
      
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = '210mm';
      clone.style.minHeight = '297mm';
      clone.style.boxShadow = 'none';
      clone.style.margin = '0';
      clone.style.transform = 'none';
      clone.style.color = '#000000';
      clone.style.backgroundColor = '#ffffff';
      clone.classList.remove('shadow-xl', 'mx-auto', 'print-container');
      
      container.appendChild(clone);
      document.body.appendChild(container);
      window.scrollTo(0, 0);

      await new Promise(resolve => setTimeout(resolve, 800));

      const opt = {
        margin: 0,
        filename: `${personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 4, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        await window.html2pdf().set(opt).from(clone).save();
      } catch (error) {
        console.error("PDF generation failed", error);
        window.print();
      } finally {
        document.body.removeChild(container);
        setIsDownloading(false);
      }
    } else {
      window.print();
      setIsDownloading(false);
    }
  };

  const handleDownloadTxt = () => {
    const { fullName, email, phone, linkedin, github, website, jobTitle } = personalInfo;
    const { professionalSummary, skills, workExperience, education, projects } = data;

    let content = `${fullName.toUpperCase()}\n${jobTitle}\n`;
    content += `${[email, phone, linkedin, github, website].filter(Boolean).join(' | ')}\n\n`;
    content += `PROFESSIONAL SUMMARY\n${'-'.repeat(20)}\n${professionalSummary}\n\n`;
    content += `SKILLS\n${'-'.repeat(6)}\n`;
    skills.forEach(s => {
      content += `${s.category}: ${s.items.join(', ')}\n`;
    });
    content += '\n';
    content += `EXPERIENCE\n${'-'.repeat(10)}\n`;
    workExperience.forEach(job => {
      content += `${job.role} at ${job.company}\n`;
      content += `${job.duration} | ${job.location}\n`;
      job.points.forEach(p => content += `• ${p}\n`);
      content += '\n';
    });
    content += `EDUCATION\n${'-'.repeat(9)}\n`;
    education.forEach(edu => {
      content += `${edu.degree}\n${edu.institution}, ${edu.year}\n`;
      if (edu.details) content += `${edu.details}\n`;
      content += '\n';
    });
    if (projects && projects.length > 0) {
      content += `PROJECTS\n${'-'.repeat(8)}\n`;
      projects.forEach(proj => {
        content += `${proj.name} (${proj.technologies.join(', ')})\n`;
        content += `${proj.description}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fullName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- TEMPLATE RENDERERS ---

  // 1. Classic ATS Template
  const ClassicTemplate = () => (
    <>
      <header className="border-b-2 border-sky-200 pb-6 mb-6 flex items-start gap-6">
        <div className="shrink-0 w-20 h-20 bg-sky-800 rounded-xl flex items-center justify-center shadow-lg border border-sky-700 print:bg-sky-800 print:border-none">
          <span className="text-4xl font-serif font-bold text-white print:text-white">
            {personalInfo.fullName ? personalInfo.fullName.trim().charAt(0).toUpperCase() : 'R'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-sky-800 uppercase mb-2 leading-none pt-1">
            {personalInfo.fullName}
          </h1>
          <p className="text-xl text-sky-600 font-medium mb-4">{personalInfo.jobTitle}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
            {personalInfo.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-sky-500" /><span>{personalInfo.email}</span></div>}
            {personalInfo.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-sky-500" /><span>{personalInfo.phone}</span></div>}
            {personalInfo.linkedin && <div className="flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5 text-sky-500" /><span className="text-sky-600 underline decoration-sky-300 underline-offset-2">{personalInfo.linkedin}</span></div>}
            {personalInfo.github && <div className="flex items-center gap-1.5"><Github className="w-3.5 h-3.5 text-sky-500" /><span>{personalInfo.github}</span></div>}
            {personalInfo.website && <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-sky-500" /><span>{personalInfo.website}</span></div>}
          </div>
        </div>
      </header>
      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">Professional Summary</h2>
          <p className="text-sm leading-relaxed text-gray-700 text-justify">{data.professionalSummary}</p>
        </section>
        <section>
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">Technical Skills</h2>
          <div className="grid grid-cols-1 gap-2">
            {data.skills.map((skillGroup, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row text-sm">
                <span className="font-semibold text-sky-700 w-32 shrink-0">{skillGroup.category}:</span>
                <span className="text-gray-700">{skillGroup.items.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">Professional Experience</h2>
          <div className="space-y-5">
            {data.workExperience.map((job, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900 text-base">{job.role}</h3>
                  <span className="text-sm text-sky-600 font-medium italic">{job.duration}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">{job.company}</span>
                  <span className="text-xs text-gray-500">{job.location}</span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 marker:text-sky-500">
                  {job.points.map((point, pIdx) => <li key={pIdx} className="text-sm text-gray-700 pl-1 leading-snug">{point}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
        {data.projects && data.projects.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">Key Projects</h2>
            <div className="space-y-4">
              {data.projects.map((project, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{project.name}</h3>
                    {project.technologies && <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded">{project.technologies.join(' • ')}</span>}
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{project.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        <section>
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">Education</h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{edu.institution}</h3>
                  <div className="text-sm text-gray-700">{edu.degree}</div>
                  {edu.details && <p className="text-xs text-gray-500 mt-0.5">{edu.details}</p>}
                </div>
                <div className="text-right">
                  <span className="block text-sm font-medium text-gray-900">{edu.year}</span>
                  <span className="block text-xs text-gray-500">{edu.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );

  // 2. Modern 2-Column Template
  const ModernTemplate = () => (
    <div className="h-full flex flex-col">
       <header className="bg-gray-900 text-white p-8 mb-6 rounded-lg mx-[-1rem] mt-[-1rem] w-[calc(100%+2rem)]">
          <div className="flex justify-between items-start">
             <div>
                <h1 className="text-4xl font-bold tracking-tight uppercase mb-2">{personalInfo.fullName}</h1>
                <p className="text-xl text-sky-400 font-medium">{personalInfo.jobTitle}</p>
             </div>
             {personalInfo.photo && (
               <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-700">
                  <img src={personalInfo.photo} className="w-full h-full object-cover" alt="Profile" />
               </div>
             )}
          </div>
       </header>

       <div className="flex gap-8 flex-1">
          {/* Left Column (Main) */}
          <div className="flex-[2] space-y-6">
             <section>
               <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Profile</h2>
               <p className="text-sm leading-relaxed text-gray-700">{data.professionalSummary}</p>
             </section>

             <section>
               <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Experience</h2>
               <div className="space-y-6">
                 {data.workExperience.map((job, idx) => (
                   <div key={idx}>
                      <div className="flex justify-between items-center mb-1">
                         <h3 className="font-bold text-gray-900">{job.role}</h3>
                         <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{job.duration}</span>
                      </div>
                      <div className="text-sm font-medium text-sky-700 mb-2">{job.company} • {job.location}</div>
                      <ul className="list-disc list-outside ml-4 space-y-1">
                        {job.points.map((point, pIdx) => <li key={pIdx} className="text-sm text-gray-600">{point}</li>)}
                      </ul>
                   </div>
                 ))}
               </div>
             </section>

             {data.projects && data.projects.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Projects</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {data.projects.map((proj, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <h3 className="font-bold text-sm text-gray-900">{proj.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
             )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="flex-1 space-y-6">
             <section>
               <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase">Contact</h2>
               <div className="space-y-2 text-sm text-gray-600">
                  {personalInfo.email && <div className="break-all">✉️ {personalInfo.email}</div>}
                  {personalInfo.phone && <div>📞 {personalInfo.phone}</div>}
                  {personalInfo.linkedin && <div className="break-all">🔗 {personalInfo.linkedin.replace('https://','')}</div>}
                  {personalInfo.website && <div className="break-all">🌐 {personalInfo.website.replace('https://','')}</div>}
               </div>
             </section>

             <section>
                <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase">Education</h2>
                <div className="space-y-4">
                   {data.education.map((edu, idx) => (
                      <div key={idx} className="text-sm">
                         <div className="font-bold text-gray-900">{edu.institution}</div>
                         <div className="text-gray-700">{edu.degree}</div>
                         <div className="text-gray-500 text-xs mt-1">{edu.year}</div>
                      </div>
                   ))}
                </div>
             </section>

             <section>
               <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase">Skills</h2>
               <div className="space-y-3">
                 {data.skills.map((skillGroup, idx) => (
                   <div key={idx}>
                     <div className="font-semibold text-xs text-sky-700 mb-1">{skillGroup.category}</div>
                     <div className="flex flex-wrap gap-1">
                        {skillGroup.items.map((item, i) => (
                           <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{item}</span>
                        ))}
                     </div>
                   </div>
                 ))}
               </div>
             </section>
          </div>
       </div>
    </div>
  );

  // 3. Creative / 3D Style Template
  const CreativeTemplate = () => (
    <div className="h-full flex bg-slate-50 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 z-0"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-100 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50 z-0"></div>

        {/* Sidebar */}
        <div className="w-[30%] bg-slate-900 text-white p-6 relative z-10 flex flex-col h-full">
            <div className="flex flex-col items-center mb-8">
               <div className="w-32 h-32 rounded-full border-4 border-white/20 shadow-xl overflow-hidden mb-4 bg-slate-800">
                  {personalInfo.photo ? (
                    <img src={personalInfo.photo} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-600">
                      {personalInfo.fullName.charAt(0)}
                    </div>
                  )}
               </div>
               <h3 className="text-xs font-bold tracking-widest text-indigo-300 uppercase mb-1">Contact</h3>
               <div className="w-full space-y-3 text-xs text-slate-300 mt-2">
                  {personalInfo.email && <div className="flex items-center gap-2 overflow-hidden"><Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{personalInfo.email}</span></div>}
                  {personalInfo.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 shrink-0" /> <span>{personalInfo.phone}</span></div>}
                  {personalInfo.website && <div className="flex items-center gap-2"><Globe className="w-3 h-3 shrink-0" /> <span className="truncate">{personalInfo.website}</span></div>}
               </div>
            </div>

            <div className="space-y-6">
                <div>
                   <h3 className="text-xs font-bold tracking-widest text-indigo-300 uppercase border-b border-slate-700 pb-2 mb-3">Education</h3>
                   <div className="space-y-3">
                      {data.education.map((edu, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                           <div className="font-bold text-white text-xs">{edu.institution}</div>
                           <div className="text-slate-400 text-[10px]">{edu.degree}</div>
                           <div className="text-indigo-400 text-[10px] mt-1">{edu.year}</div>
                        </div>
                      ))}
                   </div>
                </div>

                <div>
                   <h3 className="text-xs font-bold tracking-widest text-indigo-300 uppercase border-b border-slate-700 pb-2 mb-3">Skills</h3>
                   <div className="space-y-4">
                      {data.skills.map((skillGroup, idx) => (
                        <div key={idx}>
                           <div className="text-[10px] text-slate-400 mb-1 font-semibold">{skillGroup.category}</div>
                           <div className="flex flex-wrap gap-1">
                              {skillGroup.items.map((item, i) => (
                                 <span key={i} className="text-[10px] bg-indigo-600/20 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/20">{item}</span>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 relative z-10 overflow-hidden flex flex-col">
            <header className="mb-8">
               <h1 className="text-5xl font-black text-slate-800 tracking-tight mb-2 drop-shadow-sm">{personalInfo.fullName}</h1>
               <div className="inline-block bg-gradient-to-r from-indigo-500 to-sky-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-200">
                  {personalInfo.jobTitle}
               </div>
            </header>

            <div className="space-y-6">
               <div className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">About Me</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{data.professionalSummary}</p>
               </div>

               <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <span className="w-8 h-1 bg-indigo-500 rounded-full"></span> Experience
                  </h2>
                  <div className="space-y-4">
                     {data.workExperience.map((job, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <h3 className="font-bold text-slate-800">{job.role}</h3>
                                 <div className="text-sm text-indigo-600 font-medium">{job.company}</div>
                              </div>
                              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{job.duration}</span>
                           </div>
                           <ul className="space-y-1.5 mt-3">
                              {job.points.map((point, pIdx) => (
                                 <li key={pIdx} className="text-sm text-slate-600 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full mt-1.5 shrink-0"></span>
                                    {point}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     ))}
                  </div>
               </div>

               {data.projects && data.projects.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <span className="w-8 h-1 bg-sky-500 rounded-full"></span> Projects
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                       {data.projects.map((proj, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                             <div className="font-bold text-slate-800 text-sm mb-1">{proj.name}</div>
                             <p className="text-xs text-slate-500">{proj.description}</p>
                          </div>
                       ))}
                    </div>
                  </div>
               )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Actions Bar */}
      <div className="no-print bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-4 z-10">
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 text-gray-600 hover:text-sky-600 font-medium transition-colors self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Editor
        </button>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleDownloadTxt}
            className="flex-1 sm:flex-none bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <FileText className="w-4 h-4" /> Download Text
          </button>
          <button 
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
               <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
               <Download className="w-4 h-4" />
            )}
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Resume Document */}
      <div 
        id="resume-preview-content"
        className="print-container bg-white text-gray-900 shadow-xl mx-auto w-full max-w-[21cm] min-h-[29.7cm] p-[2cm] print:shadow-none print:w-full box-border"
        // Adjust padding for creative template since it fills the page
        style={personalInfo.templateId === 'creative' || personalInfo.templateId === 'modern' ? { padding: '2rem' } : undefined}
      >
        {personalInfo.templateId === 'classic' && <ClassicTemplate />}
        {personalInfo.templateId === 'modern' && <ModernTemplate />}
        {personalInfo.templateId === 'creative' && <CreativeTemplate />}
      </div>
    </div>
  );
};

export default ResumePreview;