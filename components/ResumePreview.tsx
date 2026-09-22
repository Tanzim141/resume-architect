import React, { useState, useRef, useEffect } from 'react';
import { GeneratedResume, UserInput } from '../types';
import { Mail, Phone, Link as LinkIcon, Download, ArrowLeft, FileText, Loader2, Github, Globe, Linkedin, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { handleDownloadDocx } from '../utils/docxExport';

interface ResumePreviewProps {
  data: GeneratedResume;
  personalInfo: UserInput;
  onEdit: () => void;
  hideActions?: boolean;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, personalInfo, onEdit, hideActions }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number | 'fit'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 210mm in pixels at standard 96dpi is ~794px
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;
  
  const fitScale = Math.max(0.38, Math.min(1.0, (containerWidth - (containerWidth < 640 ? 16 : 48)) / A4_WIDTH_PX));
  const activeScale = zoomLevel === 'fit' ? fitScale : zoomLevel;

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
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-break' }
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
      if (edu.cgpa) content += `CGPA: ${edu.cgpa}\n`;
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

  // 1. Classic ATS Template (Clean single-column, highest ATS compatibility, with photo support)
  const ClassicTemplate = () => {
    const showPhoto = Boolean(personalInfo.photo && personalInfo.showPhotoInClassic !== false);

    return (
      <div className="text-gray-900 font-sans">
        <header className="border-b-2 border-sky-200 pb-5 mb-6">
          <div className="flex items-start gap-5">
            {showPhoto && (
              <div className="shrink-0 w-20 h-20 bg-sky-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-xs border-2 border-sky-100 dark:border-slate-700 overflow-hidden print:bg-white print:border-sky-300">
                <img src={personalInfo.photo} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-serif font-bold tracking-tight text-sky-800 uppercase mb-2 leading-none pt-1">
                {personalInfo.fullName}
              </h1>
              <p className="text-xl text-sky-600 font-medium mb-3">{personalInfo.jobTitle}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600">
                {personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-1.5 hover:text-sky-800 transition-colors"><Mail className="w-3.5 h-3.5 text-sky-500" /><span>{personalInfo.email}</span></a>}
                {personalInfo.phone && <a href={`tel:${personalInfo.phone}`} className="flex items-center gap-1.5 hover:text-sky-800 transition-colors"><Phone className="w-3.5 h-3.5 text-sky-500" /><span>{personalInfo.phone}</span></a>}
                {personalInfo.linkedin && <a href={ensureAbsoluteUrl(personalInfo.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-sky-800 transition-colors"><Linkedin className="w-3.5 h-3.5 text-sky-500" /><span className="text-sky-600 underline decoration-sky-300 underline-offset-2">{personalInfo.linkedin}</span></a>}
                {personalInfo.github && <a href={ensureAbsoluteUrl(personalInfo.github)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-sky-800 transition-colors"><Github className="w-3.5 h-3.5 text-sky-500" /><span>{personalInfo.github}</span></a>}
                {personalInfo.website && <a href={ensureAbsoluteUrl(personalInfo.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-sky-800 transition-colors"><Globe className="w-3.5 h-3.5 text-sky-500" /><span>{personalInfo.website}</span></a>}
                {personalInfo.customLinks?.map((link) => (
                  <a href={ensureAbsoluteUrl(link.url)} key={link.id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-sky-800 transition-colors"><LinkIcon className="w-3.5 h-3.5 text-sky-500" /><span>{link.url}</span></a>
                ))}
              </div>
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
                <div key={idx} className="flex flex-col sm:flex-row text-sm avoid-break">
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
                <div key={idx} className="avoid-break">
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
                  <div key={idx} className="avoid-break">
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
                <div key={idx} className="flex justify-between avoid-break">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{edu.institution}</h3>
                    <div className="text-sm text-gray-700">{edu.degree}</div>
                    {edu.cgpa && <div className="text-sm text-gray-700 font-medium mt-0.5">{edu.scoreType || 'CGPA'}: {edu.cgpa}</div>}
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
      </div>
    );
  };

  // 2. Modern Professional (2-Column Balanced Layout)
  const ModernTemplate = () => (
    <div className="min-h-full flex flex-col bg-white text-slate-800 font-sans">
       {/* Header */}
       <header className="border-b-4 border-slate-800 pb-6 mb-6">
          <div className="flex justify-between items-end">
             <div>
                <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 uppercase mb-2">{personalInfo.fullName}</h1>
                <p className="text-xl text-slate-500 font-medium tracking-wide">{personalInfo.jobTitle}</p>
             </div>
             {personalInfo.photo && (
               <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm">
                  <img src={personalInfo.photo} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
               </div>
             )}
          </div>
          
          {/* Contact Bar */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-slate-600 font-medium">
            {personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"><Mail className="w-4 h-4 text-slate-400" /> {personalInfo.email}</a>}
            {personalInfo.phone && <a href={`tel:${personalInfo.phone}`} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"><Phone className="w-4 h-4 text-slate-400" /> {personalInfo.phone}</a>}
            {personalInfo.linkedin && <a href={ensureAbsoluteUrl(personalInfo.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"><Linkedin className="w-4 h-4 text-slate-400" /> {personalInfo.linkedin.replace('https://','')}</a>}
            {personalInfo.github && <a href={ensureAbsoluteUrl(personalInfo.github)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"><Github className="w-4 h-4 text-slate-400" /> {personalInfo.github.replace('https://','')}</a>}
            {personalInfo.website && <a href={ensureAbsoluteUrl(personalInfo.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"><Globe className="w-4 h-4 text-slate-400" /> {personalInfo.website.replace('https://','')}</a>}
            {personalInfo.customLinks?.map((link) => (
              <a href={ensureAbsoluteUrl(link.url)} key={link.id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"><LinkIcon className="w-4 h-4 text-slate-400" /> {link.url.replace('https://','')}</a>
            ))}
          </div>
       </header>

       <div className="flex gap-10 flex-1">
          {/* Left Column (Main) */}
          <div className="flex-[2] space-y-8">
             <section>
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Professional Profile</h2>
               <p className="text-sm leading-relaxed text-slate-700">{data.professionalSummary}</p>
             </section>

             <section>
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Work Experience</h2>
               <div className="space-y-6">
                 {data.workExperience.map((job, idx) => (
                   <div key={idx} className="relative pl-4 border-l-2 border-slate-200 avoid-break">
                      <div className="absolute w-2.5 h-2.5 bg-slate-800 rounded-full -left-[5.5px] top-1.5 ring-4 ring-white"></div>
                      <div className="flex justify-between items-start mb-1">
                         <div>
                           <h3 className="font-bold text-slate-900 text-base">{job.role}</h3>
                           <div className="text-sm font-medium text-slate-600">{job.company} • {job.location}</div>
                         </div>
                         <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{job.duration}</span>
                      </div>
                      <ul className="list-disc list-outside ml-4 mt-3 space-y-1.5 marker:text-slate-400">
                        {job.points.map((point, pIdx) => <li key={pIdx} className="text-sm text-slate-700 leading-relaxed">{point}</li>)}
                      </ul>
                   </div>
                 ))}
               </div>
             </section>

             {data.projects && data.projects.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Selected Projects</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {data.projects.map((proj, idx) => (
                      <div key={idx} className="border border-slate-200 p-4 rounded-lg hover:border-slate-300 transition-colors avoid-break">
                        <h3 className="font-bold text-sm text-slate-900 mb-1">{proj.name}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
             )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="flex-1 space-y-8">
             <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Education</h2>
                <div className="space-y-5">
                   {data.education.map((edu, idx) => (
                      <div key={idx} className="text-sm avoid-break">
                         <div className="font-bold text-slate-900">{edu.institution}</div>
                         <div className="text-slate-700 mt-0.5">{edu.degree}</div>
                         {edu.cgpa && <div className="text-slate-500 font-medium mt-0.5">{edu.scoreType || 'CGPA'}: {edu.cgpa}</div>}
                         <div className="text-slate-400 text-xs mt-1 font-medium">{edu.year}</div>
                      </div>
                   ))}
                </div>
             </section>

             <section>
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Expertise</h2>
               <div className="space-y-4">
                 {data.skills.map((skillGroup, idx) => (
                   <div key={idx}>
                     <div className="font-semibold text-xs text-slate-900 mb-2 uppercase tracking-wider">{skillGroup.category}</div>
                     <div className="flex flex-wrap gap-1.5">
                        {skillGroup.items.map((item, i) => (
                           <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">{item}</span>
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
    <div className="min-h-full flex bg-slate-100 relative font-sans">
        {/* Abstract 3D Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-violet-400/40 to-fuchsia-400/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-cyan-400/40 to-blue-400/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>

        {/* Sidebar (Glassmorphism) */}
        <div className="w-[32%] m-6 mr-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] p-6 relative z-10 flex flex-col">
            <div className="flex flex-col items-center mb-8 text-center">
               <div className="w-32 h-32 rounded-2xl shadow-lg overflow-hidden mb-5 bg-gradient-to-br from-violet-100 to-cyan-100 border-4 border-white duration-300">
                  {personalInfo.photo ? (
                    <img src={personalInfo.photo} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-violet-300">
                      {personalInfo.fullName ? personalInfo.fullName.trim().charAt(0).toUpperCase() : 'R'}
                    </div>
                  )}
               </div>
               <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{personalInfo.fullName}</h1>
               <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-600 mt-1">
                  {personalInfo.jobTitle}
               </div>
            </div>

            <div className="space-y-6 flex-1 pr-2">
                <div className="space-y-3">
                   {personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-3 text-xs text-slate-600 bg-white/50 p-2.5 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-colors"><Mail className="w-4 h-4 text-violet-500" /> <span className="truncate font-medium">{personalInfo.email}</span></a>}
                   {personalInfo.phone && <a href={`tel:${personalInfo.phone}`} className="flex items-center gap-3 text-xs text-slate-600 bg-white/50 p-2.5 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-colors"><Phone className="w-4 h-4 text-violet-500" /> <span className="font-medium">{personalInfo.phone}</span></a>}
                   {personalInfo.linkedin && <a href={ensureAbsoluteUrl(personalInfo.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs text-slate-600 bg-white/50 p-2.5 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-colors"><Linkedin className="w-4 h-4 text-violet-500" /> <span className="truncate font-medium">{personalInfo.linkedin.replace('https://','')}</span></a>}
                   {personalInfo.github && <a href={ensureAbsoluteUrl(personalInfo.github)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs text-slate-600 bg-white/50 p-2.5 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-colors"><Github className="w-4 h-4 text-violet-500" /> <span className="truncate font-medium">{personalInfo.github.replace('https://','')}</span></a>}
                   {personalInfo.website && <a href={ensureAbsoluteUrl(personalInfo.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs text-slate-600 bg-white/50 p-2.5 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-colors"><Globe className="w-4 h-4 text-violet-500" /> <span className="truncate font-medium">{personalInfo.website.replace('https://','')}</span></a>}
                   {personalInfo.customLinks?.map((link) => (
                      <a href={ensureAbsoluteUrl(link.url)} key={link.id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs text-slate-600 bg-white/50 p-2.5 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-colors"><LinkIcon className="w-4 h-4 text-violet-500" /> <span className="truncate font-medium">{link.url.replace('https://','')}</span></a>
                   ))}
                </div>

                <div>
                   <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Education</h3>
                   <div className="space-y-3">
                      {data.education.map((edu, idx) => (
                        <div key={idx} className="bg-white/60 p-3.5 rounded-xl border border-white/60 shadow-sm relative overflow-hidden avoid-break">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-400 to-cyan-400"></div>
                           <div className="font-bold text-slate-800 text-xs">{edu.institution}</div>
                           <div className="text-slate-600 text-[11px] mt-0.5 font-medium">{edu.degree}</div>
                           {edu.cgpa && <div className="text-violet-600 text-[10px] mt-1 font-bold">{edu.scoreType || 'CGPA'}: {edu.cgpa}</div>}
                           <div className="text-slate-400 text-[10px] mt-1 font-semibold">{edu.year}</div>
                        </div>
                      ))}
                   </div>
                </div>

                <div>
                   <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Skills</h3>
                   <div className="space-y-4">
                      {data.skills.map((skillGroup, idx) => (
                        <div key={idx} className="avoid-break">
                           <div className="text-[10px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider ml-1">{skillGroup.category}</div>
                           <div className="flex flex-wrap gap-1.5">
                              {skillGroup.items.map((item, i) => (
                                 <span key={i} className="text-[11px] bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm font-medium">{item}</span>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 pl-5 relative z-10 flex flex-col">
            <div className="pr-4 space-y-6">
               
               <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-violet-500"></span> About Me
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">{data.professionalSummary}</p>
               </div>

               <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 ml-2">
                     <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Experience
                  </h2>
                  <div className="space-y-4">
                     {data.workExperience.map((job, idx) => (
                        <div key={idx} className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 avoid-break">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <h3 className="font-bold text-slate-800 text-base">{job.role}</h3>
                                 <div className="text-sm text-violet-600 font-bold mt-0.5">{job.company}</div>
                              </div>
                              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl shadow-inner">{job.duration}</span>
                           </div>
                           <ul className="space-y-2 mt-4">
                              {job.points.map((point, pIdx) => (
                                 <li key={pIdx} className="text-sm text-slate-600 flex items-start gap-3 font-medium">
                                    <span className="w-1.5 h-1.5 bg-gradient-to-r from-violet-400 to-cyan-400 rounded-full mt-1.5 shrink-0 shadow-sm"></span>
                                    <span className="leading-relaxed">{point}</span>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     ))}
                  </div>
               </div>

               {data.projects && data.projects.length > 0 && (
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 ml-2">
                       <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span> Projects
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                       {data.projects.map((proj, idx) => (
                          <div key={idx} className="bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white hover:shadow-md transition-shadow group avoid-break">
                             <div className="font-bold text-slate-800 text-sm mb-2 group-hover:text-violet-600 transition-colors">{proj.name}</div>
                             <p className="text-xs text-slate-600 leading-relaxed font-medium">{proj.description}</p>
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
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Actions Bar */}
      {!hideActions && (
        <div className="no-print bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 sticky top-16 z-30 transition-colors">
          <button 
            onClick={onEdit}
            className="flex items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Editor
          </button>
          
          <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={handleDownloadTxt}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              title="Download as Plain Text"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="truncate">Text</span>
            </button>
            <button 
              onClick={() => handleDownloadDocx(personalInfo, data)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              title="Download Microsoft Word (.docx)"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">DOCX</span>
            </button>
            <button 
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="bg-sky-600 hover:bg-sky-500 text-white px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              title="Download High Resolution PDF"
            >
              {isDownloading ? (
                 <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" />
              ) : (
                 <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              )}
              <span className="truncate">{isDownloading ? 'Generating...' : 'PDF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Zoom / Viewport Toolbar on Mobile & Desktop */}
      <div className="no-print flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-medium text-gray-500 dark:text-gray-400">Scale:</span>
          <span className="font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded">
            {zoomLevel === 'fit' ? `Fit (${Math.round(activeScale * 100)}%)` : `${Math.round(activeScale * 100)}%`}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => setZoomLevel('fit')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              zoomLevel === 'fit' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="Fit to Screen Width"
          >
            Fit Width
          </button>
          <button
            onClick={() => setZoomLevel(1.0)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              zoomLevel === 1.0 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="100% Actual Size"
          >
            100%
          </button>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
          <button
            onClick={() => {
              const current = typeof zoomLevel === 'number' ? zoomLevel : activeScale;
              setZoomLevel(Math.max(0.4, Number((current - 0.1).toFixed(2))));
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const current = typeof zoomLevel === 'number' ? zoomLevel : activeScale;
              setZoomLevel(Math.min(1.5, Number((current + 0.1).toFixed(2))));
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Resume Document Wrapper for Responsive View */}
      <div 
        ref={containerRef}
        className="w-full flex justify-center overflow-x-auto p-2 sm:p-6 bg-slate-100 dark:bg-slate-900/70 rounded-xl border border-gray-200 dark:border-gray-800"
      >
        <div 
          className="resume-preview-scalable origin-top transition-transform duration-150"
          style={{ 
            width: '210mm',
            transform: `scale(${activeScale})`,
            height: `${Math.round(A4_HEIGHT_PX * activeScale)}px`,
            marginBottom: '1rem'
          }}
        >
            <div 
              id="resume-preview-content"
              className="print-container bg-white text-gray-900 shadow-xl w-[210mm] min-h-[297mm] box-border print:shadow-none print:w-auto overflow-hidden rounded-xs"
              style={{
                ...(personalInfo.templateId === 'classic' ? { padding: '2cm' } : 
                    personalInfo.templateId === 'creative' ? { padding: '0' } : 
                    personalInfo.templateId === 'modern' ? { padding: '2rem' } : undefined)
              }}
            >
              {personalInfo.templateId === 'classic' && <ClassicTemplate />}
              {personalInfo.templateId === 'modern' && <ModernTemplate />}
              {personalInfo.templateId === 'creative' && <CreativeTemplate />}
            </div>
        </div>
      </div>
      
      <style>{`
        .avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        @media print {
          .resume-preview-scalable { 
            transform: none !important; 
            height: auto !important; 
            width: 100% !important; 
            margin: 0 !important; 
          }
        }
      `}</style>
    </div>
  );
};

export default ResumePreview;