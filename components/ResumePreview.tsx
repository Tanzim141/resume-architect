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
    // Find the original element
    const element = document.getElementById('resume-preview-content');
    
    if (element && window.html2pdf) {
      // 1. Create a visible container to hold the clone
      // We place it on top of everything to ensure html2canvas can capture it
      // "White screen" issues often occur when the element is hidden or off-screen
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.zIndex = '9999'; // On top of everything
      container.style.backgroundColor = 'white'; // White background
      container.style.overflowY = 'scroll'; // Allow internal scrolling if needed
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'flex-start';
      
      // 2. Clone the element
      const clone = element.cloneNode(true) as HTMLElement;
      
      // 3. Style the clone for A4
      clone.style.width = '210mm';
      clone.style.minHeight = '297mm';
      clone.style.boxShadow = 'none';
      clone.style.margin = '0';
      clone.style.transform = 'none'; // Reset any transforms
      
      // Ensure text is black and background is white
      clone.style.color = '#000000';
      clone.style.backgroundColor = '#ffffff';

      // Remove specific screen-only classes
      clone.classList.remove('shadow-xl', 'mx-auto', 'print-container');
      
      // 4. Add to DOM
      container.appendChild(clone);
      document.body.appendChild(container);

      // Scroll to top to ensure capture starts correctly
      window.scrollTo(0, 0);

      // 5. Wait for layout and fonts
      await new Promise(resolve => setTimeout(resolve, 800));

      const opt = {
        margin: 0,
        filename: `${personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 8, // Increased to 8 for ultra-sharp resolution
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
        alert("PDF generation failed. Opening print dialog instead.");
        window.print();
      } finally {
        // 6. Cleanup
        document.body.removeChild(container);
        setIsDownloading(false);
      }
    } else {
      // Fallback
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
      >
        
        {/* Header with Logo */}
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
              {personalInfo.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-500" />
                  <span>{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-500" />
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.linkedin && (
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-sky-600 underline decoration-sky-300 underline-offset-2">{personalInfo.linkedin}</span>
                </div>
              )}
              {personalInfo.github && (
                <div className="flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-sky-500" />
                  <span>{personalInfo.github}</span>
                </div>
              )}
              {personalInfo.website && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                  <span>{personalInfo.website}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Summary */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed text-gray-700 text-justify">
            {data.professionalSummary}
          </p>
        </section>

        {/* Skills */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">
            Technical Skills
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {data.skills.map((skillGroup, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row text-sm">
                <span className="font-semibold text-sky-700 w-32 shrink-0">{skillGroup.category}:</span>
                <span className="text-gray-700">{skillGroup.items.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">
            Professional Experience
          </h2>
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
                  {job.points.map((point, pIdx) => (
                    <li key={pIdx} className="text-sm text-gray-700 pl-1 leading-snug">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">
              Key Projects
            </h2>
            <div className="space-y-4">
              {data.projects.map((project, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{project.name}</h3>
                    {project.technologies && (
                      <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                        {project.technologies.join(' • ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        <section>
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider border-b border-sky-200 pb-1 mb-3">
            Education
          </h2>
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
    </div>
  );
};

export default ResumePreview;