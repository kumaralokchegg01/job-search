import mongoose, { Schema, Document } from 'mongoose';

export interface IParsedResume extends Document {
  userId: mongoose.Types.ObjectId;
  originalFileName: string;
  fileUrl?: string;

  // Extracted Data
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };

  // Work Experience
  workExperience: Array<{
    companyName: string;
    jobTitle: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent: boolean;
    description?: string;
  }>;
  totalExperienceYears?: number;

  // Education
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    graduationDate?: Date;
  }>;

  // Skills (from regex matching against 100+ database)
  skills: {
    programming: string[];
    frontend: string[];
    backend: string[];
    databases: string[];
    cloud: string[];
    tools: string[];
    soft: string[];
  };
  allSkills: string[];

  // Certifications
  certifications: Array<{
    name: string;
    issuer?: string;
    issueDate?: Date;
    expiryDate?: Date;
  }>;

  // Quality
  completeness: number;
  qualityScore: number;
  extractedText: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const ParsedResumeSchema = new Schema<IParsedResume>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    originalFileName: { type: String, required: true },
    fileUrl: String,

    contact: {
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
    },

    workExperience: [
      {
        companyName: { type: String, required: true },
        jobTitle: { type: String, required: true },
        startDate: Date,
        endDate: Date,
        isCurrent: { type: Boolean, default: false },
        description: String,
      },
    ],
    totalExperienceYears: { type: Number, default: 0 },

    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: String,
        graduationDate: Date,
      },
    ],

    skills: {
      programming: [String],
      frontend: [String],
      backend: [String],
      databases: [String],
      cloud: [String],
      tools: [String],
      soft: [String],
    },
    allSkills: { type: [String], index: true },

    certifications: [
      {
        name: { type: String, required: true },
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
      },
    ],

    completeness: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0 },
    extractedText: String,
  },
  { timestamps: true }
);

export default mongoose.model<IParsedResume>('ParsedResume', ParsedResumeSchema);
