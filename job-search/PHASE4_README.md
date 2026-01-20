# JobIntel Phase 4: Resume Parsing & Advanced Matching

**Phase Duration:** 1-2 weeks (7 days development)  
**Team Size:** 2 developers  
**Priority Level:** HIGH (enables intelligent matching)  
**Prerequisites:** Phase 1, Phase 2, Phase 3 must be complete  
**Created:** January 18, 2026

---

## 📋 PHASE 4 OVERVIEW

Phase 4 enables intelligent resume parsing and advanced matching features that leverage user profiles for superior job recommendations:

1. ✅ PDF/DOCX resume file extraction
2. ✅ NLP-based skill detection from resume text
3. ✅ Work history & education parsing
4. ✅ Resume quality assessment
5. ✅ Continuous matching service (triggers when resume uploaded)
6. ✅ Match insights & recommendations
7. ✅ Trending jobs for user profile
8. ✅ Skill gap analysis
9. ✅ Match notification system
10. ✅ Advanced filtering & sorting

This phase connects **resume data** → **intelligent matching** → **personalized recommendations**

---

## 📊 PHASE 4 DELIVERABLES

### By End of Phase 4, You Should Have:
- ✅ Resume file upload handler (PDF/DOCX)
- ✅ Text extraction from documents (pdfjs + docx libraries)
- ✅ NLP-based skill detection (regex + AI-powered)
- ✅ Work history parser (timeline extraction)
- ✅ Education parser (degree, institution extraction)
- ✅ Resume quality score (0-100)
- ✅ Automatic matching trigger on resume upload
- ✅ Match insights (why you matched, skill gaps)
- ✅ Trending jobs by user profile
- ✅ Skill gap recommendations
- ✅ Advanced search with saved filters
- ✅ Match notification preferences
- ✅ Performance: Parse resume in <2 seconds

### Testing Acceptance Criteria:
```bash
✅ Upload PDF resume - extracts text correctly
✅ Upload DOCX resume - extracts text correctly
✅ Skill detection identifies 10+ technologies
✅ Work history parsed with dates
✅ Education parsed correctly
✅ Resume quality score calculated (0-100)
✅ Automatic matching triggered on upload
✅ 100+ jobs matched in <10 seconds
✅ Match insights show skill gaps
✅ Trending jobs reflect user profile
✅ Notification preferences respected
✅ Advanced filters work correctly (role, level, tech stack)
✅ Saved filters persist and load
✅ Match API returns sorted results
✅ Performance: Upload + parse + match < 5 seconds
```

---

## 🎯 DETAILED PHASE 4 TASKS

### TASK 4.1: Resume File Upload Handler (Day 1, 3-4 hours)

**Objective:** Accept PDF/DOCX files and extract raw text

**Files to Create:**

#### 1️⃣ File Upload Middleware
**File:** `src/middleware/fileUpload.ts`

```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/resumes';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${req.user?.id || 'unknown'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'));
  }
};

export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});
```

#### 2️⃣ PDF Text Extraction
**File:** `src/services/pdfExtractor.ts`

```typescript
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { logger } from '../utils/logger';

class PDFExtractor {
  /**
   * Extract text from PDF file
   */
  async extractText(filePath: string): Promise<string> {
    try {
      const fs = require('fs').promises;
      const fileData = await fs.readFile(filePath);

      const pdf = await pdfjsLib.getDocument(new Uint8Array(fileData)).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n';
      }

      logger.info(`Extracted text from PDF: ${pdf.numPages} pages`);
      return fullText;
    } catch (err) {
      logger.error(`PDF extraction error: ${err}`);
      throw new Error(`Failed to extract PDF: ${err}`);
    }
  }

  /**
   * Get PDF page count
   */
  async getPageCount(filePath: string): Promise<number> {
    try {
      const fs = require('fs').promises;
      const fileData = await fs.readFile(filePath);
      const pdf = await pdfjsLib.getDocument(new Uint8Array(fileData)).promise;
      return pdf.numPages;
    } catch (err) {
      logger.error(`Failed to get PDF page count: ${err}`);
      return 0;
    }
  }
}

export const pdfExtractor = new PDFExtractor();
```

#### 3️⃣ DOCX Text Extraction
**File:** `src/services/docxExtractor.ts`

```typescript
import mammoth from 'mammoth';
import { logger } from '../utils/logger';

class DOCXExtractor {
  /**
   * Extract text from DOCX file
   */
  async extractText(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;

      logger.info(`Extracted text from DOCX: ${text.length} characters`);
      return text;
    } catch (err) {
      logger.error(`DOCX extraction error: ${err}`);
      throw new Error(`Failed to extract DOCX: ${err}`);
    }
  }

  /**
   * Extract with formatting (optional)
   */
  async extractTextWithFormatting(filePath: string): Promise<string> {
    try {
      const result = await mammoth.convertToHtml({ path: filePath });
      return result.value;
    } catch (err) {
      logger.error(`DOCX extraction with formatting error: ${err}`);
      throw new Error(`Failed to extract DOCX with formatting: ${err}`);
    }
  }
}

export const docxExtractor = new DOCXExtractor();
```

#### 4️⃣ Universal Resume Extractor
**File:** `src/services/resumeExtractor.ts`

```typescript
import path from 'path';
import { pdfExtractor } from './pdfExtractor';
import { docxExtractor } from './docxExtractor';
import { logger } from '../utils/logger';

class ResumeExtractor {
  /**
   * Extract text from resume file (PDF or DOCX)
   */
  async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === '.pdf') {
        return await pdfExtractor.extractText(filePath);
      } else if (ext === '.docx' || ext === '.doc') {
        return await docxExtractor.extractText(filePath);
      } else {
        throw new Error(`Unsupported file format: ${ext}`);
      }
    } catch (err) {
      logger.error(`Resume extraction failed: ${err}`);
      throw err;
    }
  }

  /**
   * Validate file before processing
   */
  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    const allowedExts = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExts.includes(ext)) {
      return { valid: false, error: `File type ${ext} not supported` };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    return { valid: true };
  }

  /**
   * Clean extracted text
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Remove extra whitespace
      .replace(/[^\w\s\-.,()@#&]/g, '') // Remove special characters
      .trim();
  }
}

export const resumeExtractor = new ResumeExtractor();
```

**Checklist:**
- [ ] Install multer for file uploads
- [ ] Install pdfjs-dist for PDF extraction
- [ ] Install mammoth for DOCX extraction
- [ ] Create file upload middleware with size limits
- [ ] Create PDF text extractor
- [ ] Create DOCX text extractor
- [ ] Create universal resume extractor
- [ ] Test: Upload PDF resume, extract text
- [ ] Test: Upload DOCX resume, extract text
- [ ] Test: Reject files > 5MB
- [ ] Test: Reject unsupported formats

---

### TASK 4.2: NLP-Based Skill Detection (Day 1-2, 4-5 hours)

**Objective:** Extract technical skills from resume text

**File:** `src/services/skillDetectionService.ts`

```typescript
import { logger } from '../utils/logger';

interface SkillDetectionResult {
  technicalSkills: string[];
  softSkills: string[];
  languages: string[];
  frameworks: string[];
  tools: string[];
  databases: string[];
  confidence: number;
  summary: string;
}

// Comprehensive skill database
const SKILL_DATABASE = {
  // Programming Languages
  languages: [
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'php',
    'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'groovy', 'perl', 'bash',
    'shell', 'html', 'css', 'sql', 'plsql', 'nosql', 'vb.net', 'objective-c', 'dart'
  ],

  // Frontend Frameworks
  frontendFrameworks: [
    'react', 'angular', 'vue', 'vue.js', 'svelte', 'ember', 'next.js', 'nuxt',
    'gatsby', 'solid', 'qwik', 'astro', 'remix', 'tailwind', 'bootstrap', 'material ui',
    'chakra', 'styled components', 'sass', 'less', 'webpack', 'vite', 'parcel',
    'rollup', 'gulp', 'grunt'
  ],

  // Backend Frameworks
  backendFrameworks: [
    'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
    'asp.net', 'laravel', 'rails', 'sinatra', 'gin', 'echo', 'fiber', 'actix',
    'rocket', 'phoenix', 'elixir', 'koa', 'hapi', 'nest.js', 'adonis',
    'graphql', 'rest', 'fastify'
  ],

  // Databases
  databases: [
    'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra',
    'dynamodb', 'firestore', 'realm', 'sqlite', 'oracle', 'sql server', 'mariadb',
    'couchdb', 'neo4j', 'influxdb', 'memcached', 'cockroachdb', 'clickhouse',
    'pinecone', 'weaviate'
  ],

  // Cloud Platforms
  cloudPlatforms: [
    'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'linode',
    'vercel', 'netlify', 'railway', 'render', 'supabase', 'firebase', 'ibm cloud',
    'oracle cloud', 'alibaba cloud', 'vultr'
  ],

  // DevOps & Tools
  devopsTools: [
    'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 'circleci',
    'travis ci', 'terraform', 'ansible', 'chef', 'puppet', 'vagrant', 'prometheus',
    'grafana', 'datadog', 'new relic', 'splunk', 'elk stack', 'jira', 'confluence',
    'git', 'github', 'gitlab', 'bitbucket', 'svn', 'maven', 'gradle', 'npm', 'yarn',
    'pip', 'cargo', 'make', 'cmake'
  ],

  // Mobile Frameworks
  mobileFrameworks: [
    'react native', 'flutter', 'ionic', 'cordova', 'xamarin', 'nativescript',
    'swift', 'kotlin', 'objective-c', 'java android'
  ],

  // Testing Frameworks
  testingFrameworks: [
    'jest', 'mocha', 'chai', 'jasmine', 'cypress', 'selenium', 'puppeteer',
    'playwright', 'nightwatch', 'protractor', 'junit', 'pytest', 'unittest',
    'rspec', 'cucumber', 'nunit', 'xunit', 'testng', 'mockito', 'sinon',
    'enzyme', 'react testing library', 'vitest'
  ],

  // Soft Skills
  softSkills: [
    'communication', 'teamwork', 'leadership', 'problem solving', 'critical thinking',
    'time management', 'project management', 'agile', 'scrum', 'kanban',
    'mentoring', 'collaboration', 'adaptability', 'creativity', 'attention to detail',
    'analytical', 'organizational', 'strategic thinking', 'decision making',
    'conflict resolution', 'negotiation', 'presentation'
  ],

  // Data Science / ML
  mlTools: [
    'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'pandas', 'numpy', 'matplotlib',
    'seaborn', 'plotly', 'jupyter', 'apache spark', 'hadoop', 'airflow',
    'dbt', 'looker', 'tableau', 'power bi', 'qlik', 'microstrategy'
  ],
};

class SkillDetectionService {
  /**
   * Extract skills from resume text
   */
  detectSkills(resumeText: string): SkillDetectionResult {
    const textLower = resumeText.toLowerCase();
    const found = {
      technicalSkills: new Set<string>(),
      softSkills: new Set<string>(),
      languages: new Set<string>(),
      frameworks: new Set<string>(),
      tools: new Set<string>(),
      databases: new Set<string>(),
    };

    // Search for each skill category
    Object.entries(SKILL_DATABASE).forEach(([category, skills]) => {
      skills.forEach((skill) => {
        // Use word boundaries for more accurate matching
        const regex = new RegExp(`\\b${skill}\\b|${skill}`, 'gi');

        if (regex.test(textLower)) {
          if (category === 'softSkills') {
            found.softSkills.add(skill);
          } else if (category === 'languages') {
            found.languages.add(skill);
          } else if (category === 'frontendFrameworks' || category === 'backendFrameworks') {
            found.frameworks.add(skill);
          } else if (category === 'databases') {
            found.databases.add(skill);
          } else if (category === 'devopsTools' || category === 'testingFrameworks' || category === 'mlTools') {
            found.tools.add(skill);
          }
        }
      });
    });

    // All technical skills combined
    const technicalSkills = [
      ...found.languages,
      ...found.frameworks,
      ...found.databases,
      ...found.tools,
    ];

    // Calculate confidence based on diversity and count
    const confidenceScore = Math.min(
      100,
      (technicalSkills.length / 10) * 100 * 0.7 +
      (found.softSkills.size / 5) * 100 * 0.3
    );

    const summary = `Found ${technicalSkills.length} technical skills and ${found.softSkills.size} soft skills`;

    logger.info(`Skill detection complete: ${summary}`);

    return {
      technicalSkills: Array.from(technicalSkills).sort(),
      softSkills: Array.from(found.softSkills).sort(),
      languages: Array.from(found.languages).sort(),
      frameworks: Array.from(found.frameworks).sort(),
      tools: Array.from(found.tools).sort(),
      databases: Array.from(found.databases).sort(),
      confidence: Math.round(confidenceScore),
      summary,
    };
  }

  /**
   * Detect programming languages specifically
   */
  detectLanguages(resumeText: string): string[] {
    const textLower = resumeText.toLowerCase();
    const languages = new Set<string>();

    SKILL_DATABASE.languages.forEach((lang) => {
      if (new RegExp(`\\b${lang}\\b`, 'i').test(textLower)) {
        languages.add(lang);
      }
    });

    return Array.from(languages).sort();
  }

  /**
   * Detect frameworks and libraries
   */
  detectFrameworks(resumeText: string): string[] {
    const textLower = resumeText.toLowerCase();
    const frameworks = new Set<string>();

    [...SKILL_DATABASE.frontendFrameworks, ...SKILL_DATABASE.backendFrameworks].forEach((fw) => {
      if (new RegExp(fw, 'i').test(textLower)) {
        frameworks.add(fw);
      }
    });

    return Array.from(frameworks).sort();
  }

  /**
   * Rank skills by frequency (appears multiple times = more important)
   */
  rankSkillsByFrequency(resumeText: string, skills: string[]): { skill: string; count: number }[] {
    const textLower = resumeText.toLowerCase();
    const ranked: { skill: string; count: number }[] = [];

    skills.forEach((skill) => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      const matches = textLower.match(regex) || [];
      ranked.push({ skill, count: matches.length });
    });

    return ranked.sort((a, b) => b.count - a.count);
  }

  /**
   * Get skill gaps (missing common skills for a role)
   */
  getSkillGaps(detectedSkills: string[], requiredSkills: string[]): {
    missing: string[];
    matched: string[];
    percentage: number;
  } {
    const detectedLower = detectedSkills.map(s => s.toLowerCase());
    const requiredLower = requiredSkills.map(s => s.toLowerCase());

    const matched = requiredLower.filter(req =>
      detectedLower.some(det => det.includes(req) || req.includes(det))
    );

    const missing = requiredLower.filter(req =>
      !detectedLower.some(det => det.includes(req) || req.includes(det))
    );

    const percentage = Math.round((matched.length / requiredLower.length) * 100);

    return { missing, matched, percentage };
  }
}

export const skillDetectionService = new SkillDetectionService();
```

**Checklist:**
- [ ] Create comprehensive skill database (100+ skills)
- [ ] Implement skill detection with regex matching
- [ ] Detect languages, frameworks, tools, databases separately
- [ ] Rank skills by frequency
- [ ] Calculate skill gap analysis
- [ ] Test: Detect 20+ skills from sample resume
- [ ] Test: Skill frequency ranking works
- [ ] Test: Skill gap calculation accurate
- [ ] Test: Confidence score calculated correctly

---

### TASK 4.3: Work History & Education Parser (Day 2, 3-4 hours)

**Objective:** Extract work experience and education from resume text

**File:** `src/services/resumeParserService.ts`

```typescript
import { logger } from '../utils/logger';
import { skillDetectionService } from './skillDetectionService';

interface WorkExperience {
  company: string;
  role: string;
  startDate?: Date;
  endDate?: Date;
  duration?: string;
  description?: string;
  technologiesUsed?: string[];
  isCurrent?: boolean;
}

interface Education {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  graduationDate?: Date;
  gpa?: number;
  activities?: string;
}

interface ParsedResumeData {
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    github?: string;
  };
  summary?: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    frameworks: string[];
  };
  certifications?: string[];
  projects?: string[];
  totalYearsOfExperience: number;
  qualityScore: number;
}

class ResumeParserService {
  /**
   * Parse resume text into structured data
   */
  parseResume(text: string): ParsedResumeData {
    const sections = this.identifySections(text);

    const contact = this.extractContact(text);
    const summary = this.extractSummary(sections.summary || '');
    const workExperience = this.extractWorkExperience(sections.experience || '');
    const education = this.extractEducation(sections.education || '');
    const skills = this.extractSkills(text);
    const certifications = this.extractCertifications(sections.certifications || '');
    const projects = this.extractProjects(sections.projects || '');

    // Calculate years of experience
    const totalYearsOfExperience = this.calculateExperience(workExperience);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore({
      contact,
      summary,
      workExperience,
      education,
      skills,
      certifications,
      projects,
    });

    logger.info(`Resume parsed: ${totalYearsOfExperience} years experience, quality ${qualityScore}/100`);

    return {
      contact,
      summary,
      workExperience,
      education,
      skills,
      certifications,
      projects,
      totalYearsOfExperience,
      qualityScore,
    };
  }

  /**
   * Identify major sections in resume
   */
  private identifySections(text: string): Record<string, string> {
    const sectionPatterns = {
      summary: /(?:summary|about|objective|profile)[\s\n]*:?(.+?)(?=\n(?:experience|education|skills|certification|projects|contact)|$)/is,
      experience: /(?:experience|work experience|employment)[\s\n]*:?(.+?)(?=\n(?:education|skills|certification|projects|summary|contact)|$)/is,
      education: /(?:education|academic)[\s\n]*:?(.+?)(?=\n(?:experience|skills|certification|projects|summary|contact)|$)/is,
      skills: /(?:skills|technical skills)[\s\n]*:?(.+?)(?=\n(?:experience|education|certification|projects|summary|contact)|$)/is,
      certifications: /(?:certifications?|licenses?)[\s\n]*:?(.+?)(?=\n(?:experience|education|skills|projects|summary|contact)|$)/is,
      projects: /(?:projects?|portfolio)[\s\n]*:?(.+?)(?=\n(?:experience|education|skills|certification|summary|contact)|$)/is,
    };

    const sections: Record<string, string> = {};

    Object.entries(sectionPatterns).forEach(([section, pattern]) => {
      const match = text.match(pattern);
      sections[section] = match ? match[1].trim() : '';
    });

    return sections;
  }

  /**
   * Extract contact information
   */
  private extractContact(text: string) {
    const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const phoneRegex = /(\+?1?\d{9,15})/;
    const linkedInRegex = /linkedin\.com\/in\/([\w-]+)/i;
    const githubRegex = /github\.com\/([\w-]+)/i;

    return {
      email: text.match(emailRegex)?.[1],
      phone: text.match(phoneRegex)?.[1],
      location: this.extractLocation(text),
      linkedIn: text.match(linkedInRegex)?.[1],
      github: text.match(githubRegex)?.[1],
    };
  }

  /**
   * Extract location (heuristic-based)
   */
  private extractLocation(text: string): string | undefined {
    const commonCities = [
      'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai', 'kolkata',
      'new york', 'san francisco', 'seattle', 'austin', 'toronto', 'london',
      'berlin', 'paris', 'toronto', 'vancouver'
    ];

    const textLower = text.toLowerCase();

    for (const city of commonCities) {
      if (textLower.includes(city)) {
        return city;
      }
    }

    return undefined;
  }

  /**
   * Extract professional summary
   */
  private extractSummary(summarySection: string): string | undefined {
    const lines = summarySection.split('\n').filter(l => l.trim().length > 20);
    return lines[0]?.substring(0, 300) || undefined;
  }

  /**
   * Extract work experience
   */
  private extractWorkExperience(experienceSection: string): WorkExperience[] {
    const experiences: WorkExperience[] = [];

    // Split by likely job entries
    const jobBlocks = experienceSection.split(/\n(?=[A-Z][a-z]+\s+(?:Engineer|Developer|Manager|Lead|Analyst)|\d{4})/);

    for (const block of jobBlocks) {
      if (block.trim().length < 10) continue;

      const experience: WorkExperience = {
        company: '',
        role: '',
      };

      // Extract role (usually contains keywords like engineer, developer, etc)
      const roleMatch = block.match(/(?:as\s+)?(\w+\s+(?:engineer|developer|manager|lead|analyst|architect|specialist))/i);
      if (roleMatch) {
        experience.role = roleMatch[1].trim();
      }

      // Extract company (often follows role or is in first line)
      const companyMatch = block.match(/(?:at\s+|@\s+)?([A-Z][A-Za-z\s&.]+?)(?:\n|,|\|)/);
      if (companyMatch) {
        experience.company = companyMatch[1].trim();
      }

      // Extract dates
      const dateMatch = block.match(/(\w+ \d{4})\s*[-–]\s*(\w+ \d{4}|present|current)/i);
      if (dateMatch) {
        experience.startDate = this.parseDate(dateMatch[1]);
        experience.endDate = this.parseDate(dateMatch[2]);
        experience.isCurrent = /present|current/i.test(dateMatch[2]);
      }

      // Extract description (first 2 sentences)
      const descMatch = block.match(/(?:description|responsibilities?|about)?[\s:]*([\w\s.,;-]+?)(?:\n\n|\. [A-Z]|$)/);
      if (descMatch) {
        experience.description = descMatch[1].trim().substring(0, 200);
      }

      // Extract technologies
      const techMatch = block.match(/(?:technologies?|tech stack|tools?|using)[\s:]*([^.\n]+)/i);
      if (techMatch) {
        experience.technologiesUsed = techMatch[1]
          .split(/[,;/]/)
          .map(t => t.trim())
          .filter(t => t.length > 0);
      }

      if (experience.role && experience.company) {
        experiences.push(experience);
      }
    }

    return experiences;
  }

  /**
   * Extract education
   */
  private extractEducation(educationSection: string): Education[] {
    const educations: Education[] = [];

    // Split by degree entries
    const eduBlocks = educationSection.split(/\n(?=[A-Z].*(?:University|College|Institute|School))/);

    for (const block of educationSection.split('\n').filter(l => l.trim().length > 10)) {
      // Extract degree
      const degreeMatch = block.match(/(B\.?S|B\.?A|M\.?S|M\.?A|Ph\.?D|MBA|BCA|B\.?Tech|M\.?Tech|Diploma)/i);
      if (!degreeMatch) continue;

      // Extract institution
      const instMatch = block.match(/(?:from|at)?\s+([A-Z][A-Za-z\s]+(?:University|College|Institute|School))/i);

      // Extract graduation date
      const gradMatch = block.match(/(?:graduated?|graduation|pass out)[\s:]*(?:in\s+)?(\d{4})/i);

      const education: Education = {
        degree: degreeMatch[1],
        institution: instMatch ? instMatch[1].trim() : 'Unknown Institution',
        graduationDate: gradMatch ? new Date(parseInt(gradMatch[1]), 5, 1) : undefined,
      };

      educations.push(education);
    }

    return educations;
  }

  /**
   * Extract skills
   */
  private extractSkills(text: string) {
    const detection = skillDetectionService.detectSkills(text);

    return {
      technical: detection.technicalSkills,
      soft: detection.softSkills,
      languages: detection.languages,
      frameworks: detection.frameworks,
    };
  }

  /**
   * Extract certifications
   */
  private extractCertifications(certSection: string): string[] {
    return certSection
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5 && !line.startsWith('-'))
      .slice(0, 10); // Limit to 10
  }

  /**
   * Extract projects
   */
  private extractProjects(projectSection: string): string[] {
    return projectSection
      .split(/\n(?=-|•|[0-9]\.)/)
      .map(p => p.trim())
      .filter(p => p.length > 5)
      .slice(0, 5); // Limit to 5
  }

  /**
   * Calculate total years of experience
   */
  private calculateExperience(experiences: WorkExperience[]): number {
    let totalMonths = 0;

    experiences.forEach((exp) => {
      if (exp.startDate && exp.endDate) {
        const months = (exp.endDate.getTime() - exp.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalMonths += months;
      } else if (exp.startDate && exp.isCurrent) {
        const months = (new Date().getTime() - exp.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalMonths += months;
      }
    });

    return Math.round(totalMonths / 12);
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(data: ParsedResumeData): number {
    let score = 0;

    // Contact info (10 points)
    if (data.contact.email) score += 5;
    if (data.contact.phone || data.contact.linkedIn) score += 5;

    // Summary (10 points)
    if (data.summary) score += 10;

    // Work experience (30 points)
    if (data.workExperience.length > 0) score += 10;
    if (data.workExperience.length > 2) score += 10;
    if (data.workExperience.some(e => e.technologiesUsed && e.technologiesUsed.length > 0)) score += 10;

    // Education (20 points)
    if (data.education.length > 0) score += 20;

    // Skills (20 points)
    if (data.skills.technical.length > 5) score += 10;
    if (data.skills.soft.length > 3) score += 10;

    // Certifications & Projects (10 points)
    if ((data.certifications && data.certifications.length > 0) || (data.projects && data.projects.length > 0)) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string): Date {
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const match = dateStr.match(/(\w+)\s+(\d{4})/i);
    if (match) {
      const month = months[match[1].toLowerCase()] ?? 0;
      const year = parseInt(match[2]);
      return new Date(year, month, 1);
    }

    return new Date();
  }
}

export const resumeParserService = new ResumeParserService();
```

**Checklist:**
- [ ] Create resume parser service
- [ ] Implement section identification
- [ ] Extract contact information (email, phone, LinkedIn, GitHub)
- [ ] Extract work experience with dates
- [ ] Extract education with degree & institution
- [ ] Extract certifications
- [ ] Extract projects
- [ ] Calculate experience duration
- [ ] Calculate quality score
- [ ] Test: Parse sample resume completely
- [ ] Test: Extract all work history items
- [ ] Test: Date parsing works correctly
- [ ] Test: Quality score 0-100 range

---

### TASK 4.4: Automatic Matching Trigger Service (Day 3, 2-3 hours)

**Objective:** Trigger matching when resume is uploaded

**File:** `src/services/matchingTriggerService.ts`

```typescript
import Job from '../models/Job';
import { JobMatch } from '../models/JobMatch';
import { matchingEngine } from './matchingEngine';
import { logger } from '../utils/logger';

interface MatchingJobData {
  userId: string;
  resumeId: string;
  totalJobs?: number;
}

class MatchingTriggerService {
  /**
   * Trigger matching for user after resume upload
   */
  async triggerMatchingForUser(userId: string): Promise<{
    newMatches: number;
    totalMatches: number;
    duration: number;
  }> {
    const startTime = Date.now();

    // Get all active jobs
    const jobs = await Job.find({ isActive: true }).limit(10000); // Limit for performance

    if (jobs.length === 0) {
      logger.warn(`No active jobs to match for user ${userId}`);
      return { newMatches: 0, totalMatches: 0, duration: 0 };
    }

    let newMatches = 0;

    for (const job of jobs) {
      try {
        // Check if match already exists
        const existingMatch = await JobMatch.findOne({ userId, jobId: job._id });

        if (!existingMatch) {
          // Calculate and save new match
          const breakdown = await matchingEngine.calculateMatch(userId, job._id.toString());

          const match = new JobMatch({
            userId,
            jobId: job._id,
            externalJobId: job.externalJobId,
            ...breakdown,
          });

          await match.save();
          newMatches++;
        }
      } catch (err) {
        logger.debug(`Match error for job ${job._id}: ${err}`);
      }
    }

    const duration = Date.now() - startTime;

    const totalMatches = await JobMatch.countDocuments({ userId });

    logger.info(
      `Matching triggered for user ${userId}: ` +
      `${newMatches} new matches, ${totalMatches} total, ${duration}ms`
    );

    return { newMatches, totalMatches, duration };
  }

  /**
   * Get top matches for user (sorted by score)
   */
  async getTopMatches(userId: string, limit: number = 20): Promise<any[]> {
    return JobMatch.find({ userId })
      .populate('jobId')
      .sort({ totalScore: -1 })
      .limit(limit);
  }

  /**
   * Get matches by type
   */
  async getMatchesByType(userId: string, matchType: 'excellent' | 'good' | 'okay' | 'poor'): Promise<any[]> {
    return JobMatch.find({ userId, matchType })
      .populate('jobId')
      .sort({ totalScore: -1 });
  }

  /**
   * Get skills analysis for user
   */
  async getSkillsAnalysis(userId: string): Promise<{
    totalMatches: number;
    averageScore: number;
    topSkillMatches: string[];
    weakAreas: string[];
  }> {
    const matches = await JobMatch.find({ userId }).populate('jobId');

    if (matches.length === 0) {
      return {
        totalMatches: 0,
        averageScore: 0,
        topSkillMatches: [],
        weakAreas: [],
      };
    }

    // Find commonly matched skills
    const skillMatchMap: Record<string, number> = {};

    matches.forEach((match) => {
      const job = match.jobId as any;
      if (job.techStack && job.techStack.length > 0) {
        job.techStack.forEach((tech: string) => {
          skillMatchMap[tech] = (skillMatchMap[tech] || 0) + 1;
        });
      }
    });

    const topSkillMatches = Object.entries(skillMatchMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    const averageScore = Math.round(
      matches.reduce((sum, m) => sum + m.totalScore, 0) / matches.length
    );

    return {
      totalMatches: matches.length,
      averageScore,
      topSkillMatches,
      weakAreas: this.identifyWeakAreas(matches),
    };
  }

  /**
   * Identify weak areas from matches
   */
  private identifyWeakAreas(matches: any[]): string[] {
    const issues: string[] = [];

    const avgSkillMatch = matches.reduce((sum, m) => sum + m.skillMatch, 0) / matches.length;
    const avgRoleMatch = matches.reduce((sum, m) => sum + m.roleMatch, 0) / matches.length;
    const avgLevelMatch = matches.reduce((sum, m) => sum + m.levelMatch, 0) / matches.length;
    const avgExpMatch = matches.reduce((sum, m) => sum + m.experienceMatch, 0) / matches.length;

    if (avgSkillMatch < 15) issues.push('Limited technical skills');
    if (avgRoleMatch < 8) issues.push('Role mismatch with targets');
    if (avgLevelMatch < 8) issues.push('Experience level mismatch');
    if (avgExpMatch < 5) issues.push('Under-experienced for target roles');

    return issues;
  }

  /**
   * Get trending jobs for user profile
   */
  async getTrendingJobsForUser(userId: string, limit: number = 10): Promise<any[]> {
    const user = await Job.db.collection('users').findOne({ _id: userId });

    if (!user) {
      return [];
    }

    const targetDomains = (user as any).targetDomains || [];
    const targetRoles = (user as any).targetRoles || [];

    const query: any = { isActive: true };

    if (targetDomains.length > 0) {
      query.domain = { $in: targetDomains };
    }

    if (targetRoles.length > 0) {
      query.title = { $in: targetRoles };
    }

    return Job.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Recompute all matches for user
   */
  async recomputeUserMatches(userId: string): Promise<number> {
    // Delete old matches
    await JobMatch.deleteMany({ userId });

    // Trigger new matching
    const result = await this.triggerMatchingForUser(userId);

    return result.newMatches;
  }
}

export const matchingTriggerService = new MatchingTriggerService();
```

**Checklist:**
- [ ] Create matching trigger service
- [ ] Implement automatic matching on resume upload
- [ ] Implement top matches retrieval
- [ ] Implement matches by type (excellent/good/okay/poor)
- [ ] Implement skills analysis
- [ ] Implement weak areas identification
- [ ] Implement trending jobs for user
- [ ] Test: Upload resume, auto-matching triggers
- [ ] Test: Matches created correctly
- [ ] Test: Top matches sorted by score
- [ ] Test: Skills analysis accurate
- [ ] Test: Performance: Match 100 jobs in <5 seconds

---

### TASK 4.5: Resume Controller & Endpoints (Day 3, 2-3 hours)

**Objective:** Create resume API endpoints with file upload

**File:** `src/controllers/resumeController.ts` (Updated)

```typescript
import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ParsedResume } from '../models/ParsedResume';
import User from '../models/User';
import { resumeExtractor } from '../services/resumeExtractor';
import { resumeParserService } from '../services/resumeParserService';
import { matchingTriggerService } from '../services/matchingTriggerService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

export const uploadResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Resume file required' });
  }

  try {
    // Validate file
    const validation = resumeExtractor.validateFile(req.file);
    if (!validation.valid) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: validation.error });
    }

    // Extract text
    const rawText = await resumeExtractor.extractText(req.file.path);
    const cleanText = resumeExtractor.cleanText(rawText);

    // Parse resume
    const parsedData = resumeParserService.parseResume(cleanText);

    // Delete old resume
    const oldResume = await ParsedResume.findOne({ userId: req.userId });
    if (oldResume && oldResume.filePath) {
      try {
        fs.unlinkSync(oldResume.filePath);
      } catch (err) {
        logger.warn(`Failed to delete old resume file: ${err}`);
      }
    }

    // Save new resume
    const resume = new ParsedResume({
      userId: req.userId,
      rawText: cleanText,
      uploadedFileName: req.file.originalname,
      filePath: req.file.path,
      uploadedAt: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      skills: parsedData.skills.technical,
      technicalSkills: parsedData.skills.technical,
      softSkills: parsedData.skills.soft,
      totalYearsOfExperience: parsedData.totalYearsOfExperience,
      workHistory: parsedData.workExperience,
      education: parsedData.education,
      parseQuality: parsedData.qualityScore >= 80 ? 'high' : parsedData.qualityScore >= 60 ? 'medium' : 'low',
      parseConfidence: parsedData.qualityScore,
      isActive: true,
    });

    await resume.save();

    // Update user
    const user = await User.findById(req.userId);
    if (user) {
      user.resumeUploadedAt = new Date();
      user.resumeId = resume._id;
      (user as any).calculateProfileCompleteness();
      await user.save();
    }

    // Trigger automatic matching
    const matchingResult = await matchingTriggerService.triggerMatchingForUser(req.userId!);

    logger.info(
      `Resume uploaded & matched: ${req.userId} - ` +
      `${matchingResult.newMatches} new matches, ` +
      `${parsedData.skills.technical.length} technical skills`
    );

    res.status(201).json({
      message: 'Resume uploaded and processed successfully',
      resume: {
        id: resume._id,
        uploadedAt: resume.uploadedAt,
        parseQuality: resume.parseQuality,
        parseConfidence: resume.parseConfidence,
        yearsOfExperience: parsedData.totalYearsOfExperience,
        skillsFound: parsedData.skills.technical.length,
      },
      matching: {
        newMatches: matchingResult.newMatches,
        totalMatches: matchingResult.totalMatches,
        durationMs: matchingResult.duration,
      },
    });
  } catch (err) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    logger.error(`Resume upload failed: ${err}`);
    res.status(500).json({ error: `Failed to process resume: ${err}` });
  }
});

export const getResumeAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resume = await ParsedResume.findOne({ userId: req.userId });
  if (!resume) {
    return res.status(404).json({ error: 'No resume found' });
  }

  const skillsAnalysis = await matchingTriggerService.getSkillsAnalysis(req.userId!);

  res.json({
    resume: {
      id: resume._id,
      uploadedAt: resume.uploadedAt,
      parseQuality: resume.parseQuality,
      parseConfidence: resume.parseConfidence,
    },
    experience: {
      totalYears: resume.totalYearsOfExperience,
      workHistory: resume.workHistory,
      education: resume.education,
    },
    skills: {
      technical: resume.technicalSkills,
      soft: resume.softSkills,
      count: resume.technicalSkills.length + resume.softSkills.length,
    },
    matching: skillsAnalysis,
  });
});

export const getTopMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = 20 } = req.query;

  const matches = await matchingTriggerService.getTopMatches(
    req.userId!,
    parseInt(limit as string)
  );

  res.json({
    matches,
    count: matches.length,
  });
});

export const recomputeMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const recomputedCount = await matchingTriggerService.recomputeUserMatches(req.userId!);

  res.json({
    message: 'Matches recomputed',
    newMatches: recomputedCount,
  });
});
```

**File:** `src/routes/resume.ts` (Updated)

```typescript
import express from 'express';
import * as resumeController from '../controllers/resumeController';
import { authenticateToken, requireUser } from '../middleware/auth';
import { resumeUpload } from '../middleware/fileUpload';

const router = express.Router();

router.post(
  '/upload',
  authenticateToken,
  requireUser,
  resumeUpload.single('resume'),
  resumeController.uploadResume
);

router.get('/analysis', authenticateToken, requireUser, resumeController.getResumeAnalysis);
router.get('/matches/top', authenticateToken, requireUser, resumeController.getTopMatches);
router.post('/matches/recompute', authenticateToken, requireUser, resumeController.recomputeMatches);

export default router;
```

**Checklist:**
- [ ] Update resume controller with file upload handling
- [ ] Implement resume extraction & parsing
- [ ] Implement automatic matching trigger
- [ ] Implement resume analysis endpoint
- [ ] Implement top matches endpoint
- [ ] Test: Upload PDF, triggers matching
- [ ] Test: Upload DOCX, triggers matching
- [ ] Test: Resume analysis endpoint works
- [ ] Test: Top matches sorted correctly
- [ ] Test: File cleanup on old resume delete

---

## 📝 INTEGRATION FLOW

**Resume Upload → Matching Pipeline:**

```
1. User uploads PDF/DOCX
   ↓
2. Extract text (pdfjs or mammoth)
   ↓
3. Parse resume structure
   - Contact info (email, phone, LinkedIn)
   - Work experience (dates, titles, techs)
   - Education (degree, institution)
   - Skills (technical, soft)
   ↓
4. Skill detection (regex + database)
   - 100+ technology matches
   - Soft skills detection
   - Calculate quality score
   ↓
5. Save ParsedResume model with extracted data
   ↓
6. Trigger automatic matching
   - Against ALL active jobs (10k+)
   - 6-factor algorithm for each
   - Batch save all JobMatch records
   ↓
7. Return results
   - Resume analysis
   - Top 20 matches
   - Skills summary
   - Weak areas identified
```

---

## ✅ ACCEPTANCE CRITERIA

By end of Phase 4:

```bash
✅ Upload PDF resume - extracts all sections
✅ Upload DOCX resume - extracts all sections
✅ Skill detection finds 10+ technologies
✅ Work history parsed with dates
✅ Education parsed correctly
✅ Resume quality score 0-100
✅ Automatic matching triggers on upload
✅ 100 jobs matched in <5 seconds
✅ Matches sorted by score (excellent → poor)
✅ Resume analysis shows all sections
✅ Weak areas identified
✅ Top matches endpoint works
✅ Match insights show score breakdown
✅ Skill gap analysis accurate
✅ Performance: Full upload+parse+match < 5 seconds
✅ Files properly managed (old files deleted)
```

---

## 🚀 PERFORMANCE TARGETS

| Operation | Target | Notes |
|-----------|--------|-------|
| PDF text extraction | <1s | For 3-5 page resume |
| DOCX text extraction | <500ms | Faster than PDF |
| Resume parsing | <500ms | Identify sections & parse |
| Skill detection | <100ms | Regex-based matching |
| Matching 100 jobs | <5s | 6-factor algorithm |
| Total end-to-end | <10s | Everything combined |

---

## 🎯 KEY PHASE 4 FEATURES

### 1. Smart Skill Detection
- 100+ common technologies in database
- Separate: languages, frameworks, tools, databases
- Rank by frequency (appears 3x = more important)
- Soft skills detection (leadership, communication, etc)

### 2. Intelligent Resume Parsing
- Work history with date extraction
- Education degree & institution parsing
- Certifications & projects extraction
- Quality score based on completeness
- Contact information extraction (email, LinkedIn, GitHub)

### 3. Automatic Matching Trigger
- When resume uploaded, match against 10,000+ jobs instantly
- Uses 6-factor algorithm from Phase 3
- Batch saves all JobMatch records
- Returns sorted results (excellent first)

### 4. Skills Analysis
- Show user their strengths (top matched skills)
- Identify weak areas (missing skills)
- Compare against job requirements
- Skill gap recommendations

### 5. Advanced Search
- Filter by match score (80+, 60+, etc)
- Filter by match type (excellent, good, okay)
- Save filters for later use
- Sort by relevance, date, salary

---

## 🚀 NEXT STEPS

Once Phase 4 is complete:
→ Move to **Phase 5: Notifications (Email, WhatsApp, Telegram)**
→ Then **Phase 6: Testing, Deployment, Monitoring**

---

**Document Version:** 1.0  
**Created:** January 18, 2026  
**Estimated Completion:** 1-2 weeks  
**Dependencies:** pdfjs-dist, mammoth, multer
