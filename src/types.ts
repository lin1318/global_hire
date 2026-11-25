export type UserRole = 'employee' | 'employer';

export type JobType = 'Full-time' | 'Part-time' | 'Contract';
export type ExperienceLevel = 'Entry-level' | 'Mid-level' | 'Senior';
export type WorkplaceType = 'On-site' | 'Remote' | 'Hybrid';

export interface CompanyReview {
  id: string;
  authorRole: string;
  tenure: string;
  rating: number;
  headline: string;
  comment: string;
}

export interface CompanyInsights {
  foreignNationalsPct: number;
  workplaceCommunication: string;
  visaSupportRating: number;
  employeeRating: number;
  reviewCount: number;
  salaryBenchmark: string;
  cultureSummary: string;
  benefits: string[];
  reviews: CompanyReview[];
  regionalPlatformIds: string[];
}

export type OriginalLanguageCode = 'en' | 'ja' | 'pt' | 'de';

export interface OriginalJobReviewContent {
  id: string;
  authorRole: string;
  tenure: string;
  headline: string;
  comment: string;
}

export interface OriginalJobContent {
  languageLabel: string;
  title: string;
  department: string;
  location: string;
  visaDetails: string;
  englishRequirement?: string;
  description: string;
  requirements: string[];
  salaryBenchmark: string;
  workplaceCommunication: string;
  cultureSummary: string;
  benefits: string[];
  reviews?: OriginalJobReviewContent[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  country: 'United States' | 'Japan' | 'Brazil' | 'Germany' | 'Canada' | 'Global';
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  workplace: WorkplaceType;
  salaryMin: number;
  salaryMax: number;
  salaryDisplay: string;
  visaSponsored: boolean;
  visaDetails: string;
  openToContractors?: boolean;
  englishRequirement?: string;
  postedDate: string;
  originalLanguage: OriginalLanguageCode;
  descriptionEn: string;
  descriptionJa?: string;
  requirementsEn: string[];
  requirementsJa?: string[];
  originalContent?: OriginalJobContent;
  companyInsights: CompanyInsights;
}

export interface RegionalPlatform {
  id: string;
  name: string;
  nativeName?: string;
  country: 'Japan' | 'United States' | 'Brazil' | 'Europe';
  focus: string;
  languageSupport: string;
  visaFriendly: boolean;
  activeTechRoles: string;
  responseTime: string;
  trustHighlights: string[];
  description: string;
  websiteUrl: string;
}

export type CandidateExpBucket = 'Entry (0-2 yrs)' | 'Mid-Senior (3-5 yrs)' | 'Senior (5+ yrs)';

export interface CandidateExperienceItem {
  role: string;
  company: string;
  location: string;
  period: string;
  highlights: string[];
}

export interface Candidate {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  city: string;
  country: 'Brazil' | 'Japan' | 'India' | 'Germany' | 'United States' | 'Canada';
  yearsExperience: number;
  experienceBucket: CandidateExpBucket;
  openToRemote: boolean;
  relocationReady: boolean;
  directHireEligible: boolean;
  visaReady: boolean;
  complianceNotes: string[];
  languages: { name: string; level: string }[];
  salaryExpectation: number;
  salaryDisplay: string;
  skills: string[];
  summary: string;
  education: string;
  workHistory: CandidateExperienceItem[];
}

export interface EmployerJobItem {
  id: string;
  title: string;
  department: string;
  jobType: JobType;
  workplace: WorkplaceType;
  location: string;
  salaryMin: number;
  salaryMax: number;
  visaSponsored: boolean;
  openToInternational: boolean;
  openToContractors: boolean;
  targetRegions: string[];
  englishRequirement: string;
  description: string;
  autoTranslate: boolean;
  connectedPlatforms: string[];
  status: 'Active' | 'Draft';
  applicantCount: number;
  postedDate: string;
}

export interface EmployeeProfile {
  fullName: string;
  preferredTitle: string;
  currentCountry: string;
  languages: string[];
  yearsExperience: string;
  skills: string[];
  resumeFileName: string;
  requiresVisaSponsorship: boolean;
  citizenship: string;
  targetRegions: string[];
  workplacePreference: WorkplaceType;
}

export interface EmployerProfile {
  companyName: string;
  recruiterName: string;
  headquarters: string;
  hiringRegions: string[];
  supportsVisaSponsorship: boolean;
  supportsInternationalContractors: boolean;
}

export type ApplicationStatus = 'Submitted' | 'Under Review' | 'Interview Scheduled';

export interface SubmittedApplication {
  id: string;
  jobId: string;
  appliedDateIso: string;
  appliedDateDisplay: string;
  status: ApplicationStatus;
  resumeFileName: string;
  note?: string;
}

export interface AccountRecord {
  email: string;
  role: UserRole;
  displayName: string;
  employeeProfile?: EmployeeProfile;
  employerProfile?: EmployerProfile;
}


