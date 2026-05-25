import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  ImageRun 
} from 'docx';
import { saveAs } from 'file-saver';
import { GeneratedResume, UserInput } from '../types';

// Helper to load and convert any image type (JPG, PNG, or SVG) to PNG base64 via Canvas
const convertImageToPngDataUrl = (imageUrl: string, width = 200, height = 200): Promise<string> => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve('');
      return;
    }
    
    // If already standard png/jpeg base64, return it
    if (imageUrl.startsWith('data:image/png;base64,') || imageUrl.startsWith('data:image/jpeg;base64,')) {
      resolve(imageUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(imageUrl);
        }
      } catch (err) {
        console.error("Canvas draw failed:", err);
        resolve(imageUrl);
      }
    };
    img.onerror = () => {
      // Fallback if loading failed
      resolve(imageUrl);
    };
    img.src = imageUrl;
  });
};

// Converts image url/base64 to a Uint8Array suitable for ImageRun
const getProfilePictureBytes = async (photoUrl: string): Promise<Uint8Array | null> => {
  if (!photoUrl) return null;
  try {
    const pngDataUrl = await convertImageToPngDataUrl(photoUrl, 250, 250);
    if (!pngDataUrl || !pngDataUrl.startsWith('data:')) {
      // Fallback to fetching directly if it is a standard image and canvas tainted
      const response = await fetch(photoUrl);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
    const parts = pngDataUrl.split(',');
    const base64 = parts[1];
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Error generating base64/bytes for DOCX image:", error);
    return null;
  }
};

export const handleDownloadDocx = async (personalInfo: UserInput, data: GeneratedResume) => {
  const { fullName, email, phone, linkedin, github, website, jobTitle, customLinks, photo, templateId = 'classic' } = personalInfo;
  const { professionalSummary, skills, workExperience, education, projects } = data;

  // Pre-load Profile Photo base64 bytes if available
  const photoBytes = photo ? await getProfilePictureBytes(photo) : null;
  const imageRun = photoBytes ? new ImageRun({
    data: photoBytes,
    transformation: {
      width: 80,
      height: 80,
    },
  } as any) : null;

  const appPrimaryColor = '0284C7'; // Sky line color for theme accents
  const darkGray = '334155'; // Slate dark gray
  const darkBlack = '0F172A'; // Slate-900 black

  let sectionChildren: any[] = [];

  // Helper for Section Titles with Bottom Border matching ATS rules of layouts
  const createSectionHeader = (title: string, accentColor: string = '000000') => {
    return new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 20,
          color: accentColor,
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: { bottom: { color: accentColor, space: 4, style: BorderStyle.SINGLE, size: 8 } }
    });
  };

  // 1. CLASSIC TEMPLATE FLOW
  if (templateId === 'classic') {
    // Elegant Header layout (using borderless table)
    const headerCells: TableCell[] = [];
    
    if (imageRun) {
      headerCells.push(
        new TableCell({
          children: [new Paragraph({ children: [imageRun], alignment: AlignmentType.CENTER })],
          width: { size: 18, type: WidthType.PERCENTAGE },
        })
      );
    }

    const contactUrls = [email, phone, linkedin, github, website].filter(Boolean);
    if (customLinks && customLinks.length > 0) {
      customLinks.forEach(link => contactUrls.push(link.url));
    }
    const contactInfoString = contactUrls.join('  |  ');

    const mainHeaderChildren = [
      new Paragraph({
        children: [new TextRun({ text: (fullName || 'Resume').toUpperCase(), bold: true, size: 32, color: appPrimaryColor })],
        alignment: imageRun ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: jobTitle || '', bold: true, size: 24, color: darkGray })],
        alignment: imageRun ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: contactInfoString, size: 18, color: darkGray })],
        alignment: imageRun ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { after: 120 }
      })
    ];

    headerCells.push(
      new TableCell({
        children: mainHeaderChildren,
        width: { size: imageRun ? 82 : 100, type: WidthType.PERCENTAGE },
      })
    );

    sectionChildren.push(
      new Table({
        rows: [new TableRow({ children: headerCells })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        }
      }),
      new Paragraph({ spacing: { after: 200 } })
    );

    // Summary
    if (professionalSummary) {
      sectionChildren.push(
        createSectionHeader('PROFESSIONAL SUMMARY', appPrimaryColor),
        new Paragraph({
          children: [new TextRun({ text: professionalSummary })],
          spacing: { before: 100, after: 180 },
        })
      );
    }

    // Skills
    if (skills && skills.length > 0) {
      sectionChildren.push(createSectionHeader('TECHNICAL SKILLS', appPrimaryColor));
      skills.forEach(skill => {
        sectionChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${skill.category}: `, bold: true, color: darkBlack }),
              new TextRun({ text: skill.items.join(', ') })
            ],
            spacing: { after: 80 },
          })
        );
      });
    }

    // Experience
    if (workExperience && workExperience.length > 0) {
      sectionChildren.push(createSectionHeader('PROFESSIONAL EXPERIENCE', appPrimaryColor));
      workExperience.forEach(job => {
        sectionChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: job.role, bold: true, size: 22, color: darkBlack }),
              new TextRun({ text: ` at ${job.company}`, bold: true, size: 22, color: darkGray }),
              new TextRun({ text: `\t${job.duration}`, italics: true })
            ],
            spacing: { before: 120, after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: job.location, italics: true, size: 18, color: '64748B' })],
            spacing: { after: 80 },
          })
        );

        job.points.forEach(point => {
          sectionChildren.push(
            new Paragraph({
              children: [new TextRun({ text: point })],
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        });
      });
    }

    // Projects
    if (projects && projects.length > 0) {
      sectionChildren.push(createSectionHeader('KEY PROJECTS', appPrimaryColor));
      projects.forEach(project => {
        sectionChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.name, bold: true, size: 20, color: darkBlack }),
              new TextRun({ text: project.technologies && project.technologies.length > 0 ? ` (${project.technologies.join(', ')})` : '', color: appPrimaryColor, italics: true })
            ],
            spacing: { before: 100, after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: project.description })],
            spacing: { after: 120 },
          })
        );
      });
    }

    // Education
    if (education && education.length > 0) {
      sectionChildren.push(createSectionHeader('EDUCATION', appPrimaryColor));
      education.forEach(edu => {
        sectionChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.institution, bold: true, size: 20, color: darkBlack }),
              new TextRun({ text: `\t${edu.year}`, bold: true })
            ],
            spacing: { before: 100, after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: edu.degree, italics: true }),
              new TextRun({ text: edu.cgpa ? `   |   ${edu.scoreType || 'CGPA'}: ${edu.cgpa}` : '' })
            ],
            spacing: { after: 60 },
          })
        );
        if (edu.details) {
          sectionChildren.push(
            new Paragraph({
              children: [new TextRun({ text: edu.details })],
              spacing: { after: 100 },
            })
          );
        }
      });
    }
  } 

  // 2. MODERN / COLUMNS TEMPLATE (2-Column structure)
  else if (templateId === 'modern') {
    const leftColumnItems: any[] = [];
    const rightColumnItems: any[] = [];

    // --- LEFT COLUMN (MAIN PROFILE DETAILS) ---
    if (professionalSummary) {
      leftColumnItems.push(
        new Paragraph({
          children: [new TextRun({ text: 'PROFESSIONAL PROFILE', bold: true, size: 22, color: '1E293B' })],
          spacing: { before: 100, after: 80 }
        }),
        new Paragraph({
          children: [new TextRun({ text: professionalSummary })],
          spacing: { after: 200 }
        })
      );
    }

    if (workExperience && workExperience.length > 0) {
      leftColumnItems.push(
        new Paragraph({
          children: [new TextRun({ text: 'WORK EXPERIENCE', bold: true, size: 22, color: '1E293B' })],
          spacing: { before: 180, after: 100 }
        })
      );

      workExperience.forEach(job => {
        leftColumnItems.push(
          new Paragraph({
            children: [
              new TextRun({ text: job.role, bold: true, size: 18, color: '0F172A' }),
              new TextRun({ text: `  |  ${job.company}`, bold: true, color: '475569' })
            ],
            spacing: { before: 100, after: 40 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `${job.duration}   •   ${job.location}`, italics: true, size: 16, color: '64748B' })],
            spacing: { after: 80 }
          })
        );

        job.points.forEach(point => {
          leftColumnItems.push(
            new Paragraph({
              children: [new TextRun({ text: point })],
              bullet: { level: 0 },
              spacing: { after: 40 }
            })
          );
        });
      });
    }

    if (projects && projects.length > 0) {
      leftColumnItems.push(
        new Paragraph({
          children: [new TextRun({ text: 'SELECTED PROJECTS', bold: true, size: 22, color: '1E293B' })],
          spacing: { before: 180, after: 100 }
        })
      );

      projects.forEach(project => {
        leftColumnItems.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.name, bold: true, size: 18, color: '0F172A' }),
              new TextRun({ text: project.technologies && project.technologies.length > 0 ? ` (${project.technologies.join(', ')})` : '', italics: true, color: '64748B' })
            ],
            spacing: { before: 100, after: 40 }
          }),
          new Paragraph({
            children: [new TextRun({ text: project.description })],
            spacing: { after: 100 }
          })
        );
      });
    }

    // --- RIGHT COLUMN (PHOTO, CONTACTS, EDUCATION, SKILLS) ---
    if (imageRun) {
      rightColumnItems.push(
        new Paragraph({
          children: [imageRun],
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 }
        })
      );
    }

    // Contact Details in Right Column
    rightColumnItems.push(
      new Paragraph({
        children: [new TextRun({ text: 'CONTACT INFO', bold: true, size: 20, color: '475569' })],
        spacing: { before: 100, after: 80 }
      })
    );

    const contactFields = [
      { label: 'Email', value: email },
      { label: 'Phone', value: phone },
      { label: 'LinkedIn', value: linkedin },
      { label: 'GitHub', value: github },
      { label: 'Website', value: website }
    ];

    contactFields.forEach(f => {
      if (f.value) {
        rightColumnItems.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${f.label}: `, bold: true, size: 16 }),
              new TextRun({ text: f.value, size: 16 })
            ],
            spacing: { after: 40 }
          })
        );
      }
    });

    if (customLinks && customLinks.length > 0) {
      customLinks.forEach((link, idx) => {
        rightColumnItems.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Link ${idx + 1}: `, bold: true, size: 16 }),
              new TextRun({ text: link.url, size: 16 })
            ],
            spacing: { after: 40 }
          })
        );
      });
    }

    // Skills of Right Column
    if (skills && skills.length > 0) {
      rightColumnItems.push(
        new Paragraph({
          children: [new TextRun({ text: 'EXPERTISE', bold: true, size: 20, color: '475569' })],
          spacing: { before: 180, after: 80 }
        })
      );

      skills.forEach(skill => {
        rightColumnItems.push(
          new Paragraph({
            children: [new TextRun({ text: skill.category, bold: true, size: 16, color: '0F172A' })],
            spacing: { before: 60, after: 30 }
          }),
          new Paragraph({
            children: [new TextRun({ text: skill.items.join(', ') })],
            spacing: { after: 80 }
          })
        );
      });
    }

    // Education in Right Column
    if (education && education.length > 0) {
      rightColumnItems.push(
        new Paragraph({
          children: [new TextRun({ text: 'EDUCATION', bold: true, size: 20, color: '475569' })],
          spacing: { before: 180, after: 80 }
        })
      );

      education.forEach(edu => {
        rightColumnItems.push(
          new Paragraph({
            children: [new TextRun({ text: edu.institution, bold: true, size: 16, color: '0F172A' })],
            spacing: { before: 60, after: 30 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: edu.degree, italics: true, size: 15 }),
              new TextRun({ text: edu.cgpa ? ` (${edu.scoreType || 'CGPA'}: ${edu.cgpa})` : '', size: 15 })
            ],
            spacing: { after: 40 }
          }),
          new Paragraph({
            children: [new TextRun({ text: edu.year })],
            spacing: { after: 100 }
          })
        );
      });
    }

    // Title Row
    sectionChildren.push(
      new Paragraph({
        children: [new TextRun({ text: fullName ? fullName.toUpperCase() : 'RESUME', bold: true, size: 36, color: '0F172A' })],
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [new TextRun({ text: jobTitle || '', bold: true, size: 24, color: '475569' })],
        spacing: { after: 150 }
      }),
      new Paragraph({
        border: { bottom: { color: 'E2E8F0', space: 4, style: BorderStyle.SINGLE, size: 12 } },
        spacing: { after: 200 }
      })
    );

    // Grid Side-by-Side Table with NO borders
    const modernTable = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: leftColumnItems,
              width: { size: 60, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [] }), // spacer
                ...rightColumnItems
              ],
              width: { size: 40, type: WidthType.PERCENTAGE },
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      }
    });

    sectionChildren.push(modernTable);
  } 

  // 3. CREATIVE / 3D TEMPLATE (Glass sidebar + Accent layout)
  else if (templateId === 'creative') {
    const leftSidebarChildren: any[] = [];
    const mainBodyChildren: any[] = [];

    // --- LEFT COLUMN SIDEBAR ---
    if (imageRun) {
      leftSidebarChildren.push(
        new Paragraph({
          children: [imageRun],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 150 }
        })
      );
    }

    leftSidebarChildren.push(
      new Paragraph({
        children: [new TextRun({ text: fullName || '', bold: true, size: 28, color: '1E1B4B' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [new TextRun({ text: jobTitle || '', bold: true, size: 18, color: '4B5563' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'CONTACTS', bold: true, size: 18, color: '1E1B4B' })],
        spacing: { after: 60 }
      })
    );

    const checkAndAddContact = (iconLabel: string, val: string) => {
      if (val) {
        leftSidebarChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `• ${iconLabel}: `, bold: true, size: 15, color: '4C1D95' }),
              new TextRun({ text: val, size: 15, color: '374151' })
            ],
            spacing: { after: 40 }
          })
        );
      }
    };

    checkAndAddContact('Email', email);
    checkAndAddContact('Phone', phone);
    checkAndAddContact('LinkedIn', linkedin);
    checkAndAddContact('GitHub', github);
    checkAndAddContact('Website', website);

    if (customLinks && customLinks.length > 0) {
      customLinks.forEach((link, idx) => {
        checkAndAddContact(`Url ${idx + 1}`, link.url);
      });
    }

    // Creative Left Section - Education
    if (education && education.length > 0) {
      leftSidebarChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'EDUCATION', bold: true, size: 18, color: '1E1B4B' })],
          spacing: { before: 180, after: 60 }
        })
      );

      education.forEach(edu => {
        leftSidebarChildren.push(
          new Paragraph({
            children: [new TextRun({ text: edu.institution, bold: true, size: 15, color: '1E1B4B' })],
            spacing: { after: 20 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${edu.degree}\n${edu.year}`, size: 14, color: '4B5563' }),
              new TextRun({ text: edu.cgpa ? `\n${edu.scoreType || 'CGPA'}: ${edu.cgpa}` : '', size: 14, color: '4C1D95' })
            ],
            spacing: { after: 80 }
          })
        );
      });
    }

    // Creative Left Section - Skills
    if (skills && skills.length > 0) {
      leftSidebarChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'EXPERTISE', bold: true, size: 18, color: '1E1B4B' })],
          spacing: { before: 180, after: 60 }
        })
      );

      skills.forEach(skill => {
        leftSidebarChildren.push(
          new Paragraph({
            children: [new TextRun({ text: skill.category, bold: true, size: 14, color: '4C1D95' })],
            spacing: { before: 40, after: 20 }
          }),
          new Paragraph({
            children: [new TextRun({ text: skill.items.join(', ') })],
            spacing: { after: 80 }
          })
        );
      });
    }

    // --- RIGHT COLUMN BODY ---
    if (professionalSummary) {
      mainBodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'ABOUT ME', bold: true, size: 20, color: '4C1D95' })],
          spacing: { before: 100, after: 80 }
        }),
        new Paragraph({
          children: [new TextRun({ text: professionalSummary })],
          spacing: { after: 180 }
        })
      );
    }

    if (workExperience && workExperience.length > 0) {
      mainBodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'PROFESSIONAL EXPERIENCE', bold: true, size: 20, color: '4C1D95' })],
          spacing: { before: 180, after: 100 }
        })
      );

      workExperience.forEach(job => {
        mainBodyChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: job.role, bold: true, size: 18, color: '1E1B4B' }),
              new TextRun({ text: `  (at ${job.company})`, bold: true, color: '4C1D95' })
            ],
            spacing: { before: 100, after: 40 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `${job.duration}     |     ${job.location}`, italics: true, size: 16, color: '64748B' })],
            spacing: { after: 80 }
          })
        );

        job.points.forEach(point => {
          mainBodyChildren.push(
            new Paragraph({
              children: [new TextRun({ text: point })],
              bullet: { level: 0 },
              spacing: { after: 40 }
            })
          );
        });
      });
    }

    if (projects && projects.length > 0) {
      mainBodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'KEY PROJECTS', bold: true, size: 20, color: '4C1D95' })],
          spacing: { before: 180, after: 100 }
        })
      );

      projects.forEach(project => {
        mainBodyChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.name, bold: true, size: 18, color: '1E1B4B' }),
              new TextRun({ text: project.technologies && project.technologies.length > 0 ? ` [${project.technologies.join(', ')}]` : '', italics: true, color: '4C1D95' })
            ],
            spacing: { before: 100, after: 40 }
          }),
          new Paragraph({
            children: [new TextRun({ text: project.description })],
            spacing: { after: 100 }
          })
        );
      });
    }

    // Combine as styled layout: shading for left cell
    const creativeLayoutTable = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: leftSidebarChildren,
              width: { size: 36, type: WidthType.PERCENTAGE },
              shading: { fill: 'F3F4F6' }, // soft background
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [] }), // spacing
                ...mainBodyChildren
              ],
              width: { size: 64, type: WidthType.PERCENTAGE },
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      }
    });

    sectionChildren.push(creativeLayoutTable);
  }

  // Create document sections
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const downloadName = `${(fullName || 'Resume').replace(/\s+/g, '_')}_Resume.docx`;
  saveAs(blob, downloadName);
};
