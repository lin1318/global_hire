import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  Languages,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import {
  Candidate,
  CandidateExpBucket,
  EmployerJobItem,
  EmployerProfile,
  JobType,
  WorkplaceType,
} from '../types';

export type EmployerTab = 'candidates' | 'jobs' | 'saved' | 'profile';

interface EmployerWorkspaceProps {
  activeTab: EmployerTab;
  onChangeTab: (tab: EmployerTab) => void;
  candidates: Candidate[];
  employerJobs: EmployerJobItem[];
  profile: EmployerProfile;
  savedCandidateIds: string[];
  messagedCandidateIds: string[];
  onToggleSaveCandidate: (candidateId: string) => void;
  onSendMessageCandidate: (candidateId: string, message: string) => void;
  onPublishJob: (newJob: EmployerJobItem) => void;
  onOpenOnboarding: () => void;
  onSignOut: () => void;
}

interface CandidateFilterState {
  country: string;
  experienceBuckets: CandidateExpBucket[];
  skills: string[];
  openToRemoteOnly: boolean;
  englishProfessionalOnly: boolean;
  directHireOnly: boolean;
  visaReadyOnly: boolean;
}

const DEFAULT_CANDIDATE_FILTERS: CandidateFilterState = {
  country: 'All Regions',
  experienceBuckets: [],
  skills: [],
  openToRemoteOnly: false,
  englishProfessionalOnly: false,
  directHireOnly: false,
  visaReadyOnly: false,
};

export const EmployerWorkspace: React.FC<EmployerWorkspaceProps> = ({
  activeTab,
  onChangeTab,
  candidates,
  employerJobs,
  profile,
  savedCandidateIds,
  messagedCandidateIds,
  onToggleSaveCandidate,
  onSendMessageCandidate,
  onPublishJob,
  onOpenOnboarding,
  onSignOut,
}) => {
  // Candidate Search & Filter state (Task 4)
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CandidateFilterState>(DEFAULT_CANDIDATE_FILTERS);
  const [draftFilters, setDraftFilters] = useState<CandidateFilterState>(DEFAULT_CANDIDATE_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id ?? '');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [candidateDetailTab, setCandidateDetailTab] = useState<'overview' | 'resume'>('overview');

  // Message Modal
  const [messageTarget, setMessageTarget] = useState<Candidate | null>(null);
  const [messageBody, setMessageBody] = useState('');

  // Employer Jobs Tab & Create Wizard (Task 5)
  const [jobsStatusFilter, setJobsStatusFilter] = useState<'All' | 'Active' | 'Draft'>('All');
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Job Creation Form State
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  const [department, setDepartment] = useState('Engineering');
  const [jobType, setJobType] = useState<JobType>('Full-time');
  const [workplace, setWorkplace] = useState<WorkplaceType>('Remote');
  const [locationText, setLocationText] = useState('Global Remote');
  const [openToInternational, setOpenToInternational] = useState(true);
  const [openToContractors, setOpenToContractors] = useState(true);
  const [salaryMin, setSalaryMin] = useState(95000);
  const [salaryMax, setSalaryMax] = useState(160000);
  const [visaSponsored, setVisaSponsored] = useState(true);
  const [targetRegions, setTargetRegions] = useState<string[]>([
    'Global Remote',
    'Latin America',
    'Europe',
  ]);
  const [englishRequirement, setEnglishRequirement] = useState('Business / Fluent');
  const [jobDescription, setJobDescription] = useState(
    'We are hiring a Software Engineer in our Engineering department to design scalable cloud APIs and collaborative web applications. This role is fully remote, open to international contractors, and provides visa sponsorship options for qualified engineers.'
  );
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([
    'GlobalHire Network',
    'doda (パーソル)',
  ]);

  // Published Confirmation & Preview (Revision #5)
  const [publishedJobConfirmation, setPublishedJobConfirmation] = useState<EmployerJobItem | null>(
    null
  );
  const [previewEmployerJob, setPreviewEmployerJob] = useState<EmployerJobItem | null>(null);

  const availableSkills = useMemo(() => {
    const counts = new Map<string, number>();
    candidates.forEach((c) => {
      c.skills.forEach((skill) => {
        counts.set(skill, (counts.get(skill) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([skill]) => skill);
  }, [candidates]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.country !== 'All Regions') count += 1;
    count += filters.experienceBuckets.length;
    count += filters.skills.length;
    if (filters.openToRemoteOnly) count += 1;
    if (filters.englishProfessionalOnly) count += 1;
    if (filters.directHireOnly) count += 1;
    if (filters.visaReadyOnly) count += 1;
    return count;
  }, [filters]);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return candidates.filter((cand) => {
      if (q) {
        const hay = `${cand.name} ${cand.title} ${cand.city} ${cand.country} ${cand.skills.join(
          ' '
        )}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.country !== 'All Regions' && cand.country !== filters.country) {
        return false;
      }
      if (
        filters.experienceBuckets.length > 0 &&
        !filters.experienceBuckets.includes(cand.experienceBucket)
      ) {
        return false;
      }
      if (
        filters.skills.length > 0 &&
        !filters.skills.every((skill) => cand.skills.includes(skill))
      ) {
        return false;
      }
      if (filters.openToRemoteOnly && !cand.openToRemote) {
        return false;
      }
      if (filters.englishProfessionalOnly) {
        const hasProEng = cand.languages.some(
          (l) =>
            l.name === 'English' &&
            (l.level.includes('Professional') || l.level.includes('Fluent'))
        );
        if (!hasProEng) return false;
      }
      if (filters.directHireOnly && !cand.directHireEligible) {
        return false;
      }
      if (filters.visaReadyOnly && !cand.visaReady) {
        return false;
      }
      return true;
    });
  }, [candidates, searchQuery, filters]);

  const selectedCandidate = useMemo(() => {
    const found = filteredCandidates.find((c) => c.id === selectedCandidateId);
    return found ?? filteredCandidates[0] ?? candidates.find((c) => c.id === selectedCandidateId) ?? null;
  }, [filteredCandidates, selectedCandidateId, candidates]);

  const filteredEmployerJobs = useMemo(() => {
    if (jobsStatusFilter === 'All') return employerJobs;
    return employerJobs.filter((j) => j.status === jobsStatusFilter);
  }, [employerJobs, jobsStatusFilter]);

  const activeJobCount = useMemo(
    () => employerJobs.filter((j) => j.status === 'Active').length,
    [employerJobs]
  );

  const openFilterModal = () => {
    setDraftFilters(filters);
    setIsFilterOpen(true);
  };

  const applyDraftFilters = () => {
    setFilters(draftFilters);
    setIsFilterOpen(false);
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_CANDIDATE_FILTERS);
    setDraftFilters(DEFAULT_CANDIDATE_FILTERS);
    setIsFilterOpen(false);
  };

  const handleOpenMessage = (cand: Candidate) => {
    setMessageTarget(cand);
    setMessageBody(
      `Hi ${cand.name.split(' ')[0]}, we reviewed your ${cand.title} background on GlobalHire and would love to discuss an engineering opportunity at ${profile.companyName}.`
    );
  };

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTarget || !messageBody.trim()) return;
    onSendMessageCandidate(messageTarget.id, messageBody.trim());
    setMessageTarget(null);
    setMessageBody('');
  };

  const toggleRegion = (reg: string) => {
    setTargetRegions((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  const togglePlatform = (plat: string) => {
    setConnectedPlatforms((prev) =>
      prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
    );
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep < 3) {
      setWizardStep((wizardStep + 1) as 1 | 2 | 3);
      return;
    }
    const created: EmployerJobItem = {
      id: `emp-job-${Date.now()}`,
      title: jobTitle.trim() || 'Software Engineer',
      department,
      jobType,
      workplace,
      location: workplace === 'Remote' ? 'Global Remote' : locationText.trim() || 'Remote',
      salaryMin,
      salaryMax,
      visaSponsored,
      openToInternational,
      openToContractors,
      targetRegions: targetRegions.length > 0 ? targetRegions : ['Global Remote'],
      englishRequirement,
      description: jobDescription.trim(),
      autoTranslate,
      connectedPlatforms,
      status: 'Active',
      applicantCount: 0,
      postedDate: 'Just now',
    };
    onPublishJob(created);
    setIsCreatingJob(false);
    setWizardStep(1);
    setPublishedJobConfirmation(created);
  };

  const renderAvatar = (cand: Candidate, sizeClass = 'w-12 h-12') => {
    if (cand.avatarUrl) {
      return (
        <img
          src={cand.avatarUrl}
          alt={cand.name}
          referrerPolicy="no-referrer"
          className={`${sizeClass} rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100`}
        />
      );
    }
    const initials = cand.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2);
    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-200 text-slate-700 font-display font-semibold flex items-center justify-center shrink-0 text-sm`}
      >
        {initials}
      </div>
    );
  };

  const renderCandidateDetail = (cand: Candidate) => {
    const isSaved = savedCandidateIds.includes(cand.id);
    const isMessaged = messagedCandidateIds.includes(cand.id);

    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Candidate Header — Clean, NO repeated region tags (Nov 11 revision!) */}
        <div className="p-6 border-b border-slate-200 space-y-5">
          {mobileDetailOpen && (
            <button
              type="button"
              onClick={() => setMobileDetailOpen(false)}
              className="lg:hidden min-h-[44px] -ml-2 px-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Candidates
            </button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {renderAvatar(cand, 'w-16 h-16')}
              <div className="min-w-0 space-y-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  {cand.name}
                </h2>
                <p className="text-sm sm:text-base font-medium text-slate-700">{cand.title}</p>
                {/* Single non-redundant location line */}
                <p className="text-sm text-slate-600 inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {cand.city}, {cand.country}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenMessage(cand)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isMessaged ? 'Message Sent' : 'Message'}</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleSaveCandidate(cand.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap ${
                  isSaved
                    ? 'border-blue-700 bg-blue-50 text-blue-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-700 text-blue-700' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Segmented Tabs: Overview | Resume */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-fit">
            <button
              type="button"
              onClick={() => setCandidateDetailTab('overview')}
              className={`flex-1 sm:flex-initial min-h-[40px] px-5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                candidateDetailTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setCandidateDetailTab('resume')}
              className={`flex-1 sm:flex-initial min-h-[40px] px-5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                candidateDetailTab === 'resume'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resume
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {candidateDetailTab === 'overview' ? (
            <>
              <section className="space-y-2">
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  Candidate Summary
                </h3>
                <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                  {cand.summary}
                </p>
              </section>

              {/* Structured Key Information Grid (Section 5 Improvement) */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-xs font-medium text-slate-500">Experience Level</div>
                  <div className="text-sm font-semibold text-slate-900 tabular-nums">
                    {cand.yearsExperience} years · {cand.experienceBucket}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-xs font-medium text-slate-500">Work Location Preference</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {cand.openToRemote ? 'Open to Remote & International' : 'On-site Preferred'}
                    {cand.relocationReady ? ' · Relocation Ready' : ''}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-xs font-medium text-slate-500">Language Proficiency</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {cand.languages.map((l) => `${l.name} (${l.level})`).join(' · ')}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-xs font-medium text-slate-500">Salary Expectations</div>
                  <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {cand.salaryDisplay}
                  </div>
                </div>
              </section>

              {/* Skills Section */}
              <section className="space-y-2.5 pt-4 border-t border-slate-200">
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  Primary Technical Skills
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-800">
                  {cand.skills.map((skill, idx) => (
                    <React.Fragment key={skill}>
                      <span className="font-medium">{skill}</span>
                      {idx < cand.skills.length - 1 && (
                        <span className="text-slate-300" aria-hidden="true">
                          /
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </section>

              {/* Hiring Compliance Section */}
              <section className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  Hiring Compliance &amp; Authorization
                </h3>
                <div className="space-y-2">
                  {cand.complianceNotes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            /* Resume Tab */
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Work Experience
                </h3>
                <div className="space-y-5">
                  {cand.workHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="pb-5 border-b border-slate-100 last:border-b-0 last:pb-0 space-y-2"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <h4 className="font-display text-sm font-semibold text-slate-900">
                            {item.role}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {item.company} · {item.location}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-slate-500 tabular-nums">
                          {item.period}
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                        {item.highlights.map((hl, i) => (
                          <li key={i}>{hl}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pt-4 border-t border-slate-200 space-y-1.5">
                <h3 className="font-display text-sm font-semibold text-slate-900">Education</h3>
                <p className="text-sm text-slate-700">{cand.education}</p>
              </section>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 space-y-6">
      {/* CANDIDATES TAB (Task 4) */}
      {activeTab === 'candidates' && (
        <div className="space-y-5">
          {/* Employer Overview Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => onChangeTab('jobs')}
              className="text-left bg-white border border-slate-200 hover:border-blue-700 rounded-2xl p-4 sm:p-5 transition-colors flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-medium text-slate-500">Active Job Postings</div>
                <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {activeJobCount} {activeJobCount === 1 ? 'Job' : 'Jobs'}
                </div>
              </div>
              <Briefcase className="w-5 h-5 text-blue-700 shrink-0" />
            </button>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-500">International Talent Pool</div>
                <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {filteredCandidates.length} Matches
                </div>
              </div>
              <Users className="w-5 h-5 text-slate-500 shrink-0" />
            </div>

            <button
              type="button"
              onClick={() => onChangeTab('saved')}
              className="text-left bg-white border border-slate-200 hover:border-blue-700 rounded-2xl p-4 sm:p-5 transition-colors flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-medium text-slate-500">Shortlisted Candidates</div>
                <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {savedCandidateIds.length} Saved
                </div>
              </div>
              <Bookmark className="w-5 h-5 text-blue-700 shrink-0" />
            </button>
          </div>

          {/* Search & Prominent Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Role or skill search (e.g., Software Engineer, React, Brazil)"
                  aria-label="Search candidates"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={openFilterModal}
                className={`min-h-[46px] px-5 py-2 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeFilterCount > 0
                    ? 'border-blue-700 bg-blue-50 text-blue-800'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filter Candidates</span>
                {activeFilterCount > 0 && (
                  <span className="font-mono text-xs tabular-nums">({activeFilterCount})</span>
                )}
              </button>
            </div>

            {/* Active Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {filters.country !== 'All Regions' && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, country: 'All Regions' }))}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>Location: {filters.country}</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
                {filters.skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        skills: f.skills.filter((s) => s !== skill),
                      }))
                    }
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-xs font-medium text-blue-800 inline-flex items-center gap-1.5"
                  >
                    <span>Skill: {skill}</span>
                    <X className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                ))}
                {filters.experienceBuckets.map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        experienceBuckets: f.experienceBuckets.filter((x) => x !== exp),
                      }))
                    }
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>Exp: {exp}</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
                {filters.openToRemoteOnly && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, openToRemoteOnly: false }))}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>Workplace: Remote</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
                {filters.englishProfessionalOnly && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, englishProfessionalOnly: false }))}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>English (Professional)</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
                {filters.directHireOnly && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, directHireOnly: false }))}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800 inline-flex items-center gap-1.5"
                  >
                    <span>Direct Hire Eligible</span>
                    <X className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                )}
                {filters.visaReadyOnly && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, visaReadyOnly: false }))}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>Visa Ready</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="min-h-[36px] px-2 text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="text-sm text-slate-600 tabular-nums">
                Found <span className="font-semibold text-slate-900">{filteredCandidates.length}</span>{' '}
                {filteredCandidates.length === 1 ? 'match' : 'matches'}
              </div>
            </div>
          </div>

          {/* Master-Detail Candidates Grid */}
          {filteredCandidates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <p className="font-display text-lg font-semibold text-slate-900">
                No candidates match your current filters
              </p>
              <p className="text-sm text-slate-600">
                Adjust region, experience range, or compliance criteria to view more candidates.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  clearAllFilters();
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
              >
                Reset Candidate Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Candidate List */}
              <div
                className={`lg:col-span-5 space-y-3 ${
                  mobileDetailOpen ? 'hidden lg:block' : 'block'
                }`}
              >
                {filteredCandidates.map((cand) => {
                  const isSelected = selectedCandidate?.id === cand.id;
                  const isSaved = savedCandidateIds.includes(cand.id);
                  return (
                    <div
                      key={cand.id}
                      onClick={() => {
                        setSelectedCandidateId(cand.id);
                        setCandidateDetailTab('overview');
                        setMobileDetailOpen(true);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCandidateId(cand.id);
                          setMobileDetailOpen(true);
                        }
                      }}
                      className={`p-5 rounded-2xl border bg-white cursor-pointer transition-colors space-y-3 ${
                        isSelected
                          ? 'border-blue-700 ring-1 ring-blue-700 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          {renderAvatar(cand, 'w-12 h-12')}
                          <div className="min-w-0">
                            <h3 className="font-display text-base font-semibold text-slate-900 truncate">
                              {cand.name}
                            </h3>
                            <p className="text-sm text-slate-700 truncate">{cand.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {cand.city}, {cand.country} · {cand.yearsExperience} yrs exp
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSaveCandidate(cand.id);
                          }}
                          aria-label={isSaved ? 'Remove candidate' : 'Save candidate'}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-100 shrink-0"
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              isSaved ? 'fill-blue-700 text-blue-700' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Unboxed clean skills & language summary */}
                      <div className="text-xs text-slate-600">
                        {cand.skills.slice(0, 4).join(' · ')}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {cand.salaryDisplay}
                        </span>
                        <span className="font-medium text-emerald-700 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {cand.directHireEligible ? 'Direct Hire Eligible' : 'Visa Ready'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Candidate Detail */}
              <div
                className={`lg:col-span-7 lg:sticky lg:top-20 ${
                  mobileDetailOpen ? 'block' : 'hidden lg:block'
                }`}
              >
                {selectedCandidate && renderCandidateDetail(selectedCandidate)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPLOYER JOBS & MULTI-STEP CREATION WIZARD (Task 5 + Revisions #4 & #5) */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {!isCreatingJob ? (
            <>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">
                    Employer Job Postings
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Manage active international openings or publish a new position.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingJob(true);
                    setWizardStep(1);
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Create Job
                </button>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit">
                {(['All', 'Active', 'Draft'] as const).map((status) => {
                  const count =
                    status === 'All'
                      ? employerJobs.length
                      : employerJobs.filter((j) => j.status === status).length;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setJobsStatusFilter(status)}
                      className={`min-h-[40px] px-4 py-1.5 text-sm font-medium rounded-lg transition-colors tabular-nums ${
                        jobsStatusFilter === status
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {status === 'All' ? 'All Jobs' : status === 'Active' ? 'Active' : 'Drafts'} (
                      {count})
                    </button>
                  );
                })}
              </div>

              {employerJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      No job postings yet
                    </h2>
                    <p className="text-sm text-slate-600">
                      Get started by creating your first international job listing. Published roles appear immediately to qualified job seekers on GlobalHire.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingJob(true);
                      setWizardStep(1);
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Job Listing
                  </button>
                </div>
              ) : filteredEmployerJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <p className="font-display text-base font-semibold text-slate-900">
                    No {jobsStatusFilter.toLowerCase()} job postings
                  </p>
                  <p className="text-sm text-slate-600">
                    You do not have any job listings under this status filter yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setJobsStatusFilter('All')}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Show All Jobs
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEmployerJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="font-display text-lg font-semibold text-slate-900">
                            {job.title}
                          </h2>
                          <span
                            className={`text-xs font-semibold ${
                              job.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            · {job.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {job.department} · {job.workplace} ({job.location}) · {job.postedDate}
                        </p>
                        <p className="text-xs text-slate-500">
                          {job.visaSponsored ? 'Visa Sponsorship Offered' : 'No Visa Sponsorship'}
                          {job.openToContractors ? ' · Open to International Contractors' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-mono text-base font-bold text-slate-900 tabular-nums">
                            {job.applicantCount}
                          </div>
                          <div className="text-xs text-slate-500">Applicants</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewEmployerJob(job)}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                        >
                          View Posting
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* 3-Step Create Job Posting Wizard (Revisions #4 & Section 5 Progress Indicator) */
            <form
              onSubmit={handlePublishSubmit}
              className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingJob(false)}
                    className="min-h-[40px] -ml-2 px-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Jobs
                  </button>
                  <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
                    {wizardStep === 3 ? 'Review & Post Job Listing' : 'Create Job Posting'}
                  </h1>
                </div>
                <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                  Step {wizardStep} of 3
                </span>
              </div>

              {/* Explicit Progress Bar & Clickable Step Labels */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className={`text-left transition-colors ${
                      wizardStep >= 1 ? 'text-blue-700 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    1. Position Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className={`text-center transition-colors ${
                      wizardStep >= 2 ? 'text-blue-700 font-semibold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    2. Pay &amp; Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className={`text-right transition-colors ${
                      wizardStep >= 3 ? 'text-blue-700 font-semibold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    3. Review &amp; Post
                  </button>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-700 transition-all duration-200"
                    style={{ width: `${(wizardStep / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* STEP 1: Basic Job Position Information */}
              {wizardStep === 1 && (
                <div className="space-y-5 pt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="job-title" className="block text-sm font-medium text-slate-700">
                      Job Title *
                    </label>
                    <input
                      id="job-title"
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="job-dept" className="block text-sm font-medium text-slate-700">
                        Department *
                      </label>
                      <select
                        id="job-dept"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                      >
                        <option>Engineering</option>
                        <option>Product</option>
                        <option>Data</option>
                        <option>Design</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="job-type" className="block text-sm font-medium text-slate-700">
                        Employment Type
                      </label>
                      <select
                        id="job-type"
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value as JobType)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Workplace Model
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['On-site', 'Hybrid', 'Remote'] as WorkplaceType[]).map((wp) => (
                        <button
                          key={wp}
                          type="button"
                          onClick={() => setWorkplace(wp)}
                          className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                            workplace === wp
                              ? 'border-blue-700 bg-blue-50 text-blue-800'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {wp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {workplace !== 'Remote' && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Office Location
                      </label>
                      <input
                        type="text"
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        placeholder="e.g., Tokyo, Japan or New York, US"
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-2.5 pt-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Candidate Scope
                    </label>
                    <label className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={openToInternational}
                        onChange={(e) => setOpenToInternational(e.target.checked)}
                        className="w-4 h-4 accent-blue-700"
                      />
                      <span className="text-sm text-slate-800 font-medium">
                        Open to International Candidates
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={openToContractors}
                        onChange={(e) => setOpenToContractors(e.target.checked)}
                        className="w-4 h-4 accent-blue-700"
                      />
                      <span className="text-sm text-slate-800 font-medium">
                        Open to International Contractors
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2: International Hiring Preferences, Pay, Language & Description */}
              {wizardStep === 2 && (
                <div className="space-y-5 pt-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Annual Salary Range (USD)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500">Min Salary (USD)</span>
                        <input
                          type="number"
                          step={5000}
                          value={salaryMin}
                          onChange={(e) => setSalaryMin(Number(e.target.value))}
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl tabular-nums"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500">Max Salary (USD)</span>
                        <input
                          type="number"
                          step={5000}
                          value={salaryMax}
                          onChange={(e) => setSalaryMax(Number(e.target.value))}
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Visa Sponsorship
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVisaSponsored(true)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 ${
                          visaSponsored
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {visaSponsored && <Check className="w-4 h-4" />}
                        Visa sponsorship available
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisaSponsored(false)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 ${
                          !visaSponsored
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {!visaSponsored && <Check className="w-4 h-4" />}
                        Not available
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Target Overseas Regions
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        'Global Remote',
                        'Latin America',
                        'Europe',
                        'Southeast Asia',
                        'Japan',
                        'North America',
                      ].map((reg) => {
                        const active = targetRegions.includes(reg);
                        return (
                          <button
                            key={reg}
                            type="button"
                            onClick={() => toggleRegion(reg)}
                            className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 ${
                              active
                                ? 'border-blue-700 bg-blue-50 text-blue-800'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                            <span>{reg}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      English Requirement
                    </label>
                    <select
                      value={englishRequirement}
                      onChange={(e) => setEnglishRequirement(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                    >
                      <option>Business / Fluent</option>
                      <option>Professional Working</option>
                      <option>Conversational</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Job Description *
                      </label>
                      <button
                        type="button"
                        onClick={() => setAutoTranslate(!autoTranslate)}
                        className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 ${
                          autoTranslate
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-slate-300 text-slate-700'
                        }`}
                      >
                        <Languages className="w-3.5 h-3.5" />
                        Auto-Translation: {autoTranslate ? 'On' : 'Off'}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      required
                      className="w-full p-3.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {autoTranslate && (
                      <p className="text-xs text-slate-500">
                        GlobalHire will automatically provide localized translations for international applicants.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Syndicate to Regional Partner Platforms
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {['GlobalHire Network', 'doda (パーソル)', 'Green Tech'].map((plat) => {
                        const active = connectedPlatforms.includes(plat);
                        return (
                          <button
                            key={plat}
                            type="button"
                            onClick={() => togglePlatform(plat)}
                            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 ${
                              active
                                ? 'border-blue-700 bg-blue-50 text-blue-800'
                                : 'border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                            <span>{plat}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Explicit Review & Post Page */}
              {wizardStep === 3 && (
                <div className="space-y-5 pt-2">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h2 className="font-display text-sm font-semibold text-slate-900">
                        Step 3: Review Your Job Posting Before Posting
                      </h2>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Review the complete job listing below. Edit any section if needed, then click Post Job to publish it live on GlobalHire.
                      </p>
                    </div>
                  </div>

                  {/* Built-In Review Posting Info Card */}
                  <div className="rounded-2xl border border-slate-200 divide-y divide-slate-200 overflow-hidden bg-white">
                    {/* Listing Header & Candidate-Facing Preview Summary */}
                    <div className="p-4 sm:p-5 bg-slate-50/80 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-blue-700">
                          Built-In Posting Review · {profile.companyName}
                        </span>
                        <span className="text-xs font-medium text-emerald-700">
                          Ready for GlobalHire Live Catalog
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display text-xl font-bold text-slate-900">
                          {jobTitle.trim() || 'Software Engineer'}
                        </h3>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {department} · {jobType} · {workplace} (
                          {workplace === 'Remote'
                            ? 'Global Remote'
                            : locationText.trim() || 'Remote'}
                          )
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1 tabular-nums">
                        <span className="font-mono font-semibold text-slate-900">
                          ${Math.round(salaryMin / 1000)}k – ${Math.round(salaryMax / 1000)}k USD
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          {visaSponsored ? 'Visa Sponsorship Available' : 'Standard Authorization'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{englishRequirement} English</span>
                      </div>
                    </div>

                    {/* Section 1: Position Information Review */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-500">
                          1. Position Info
                        </h4>
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                        >
                          Edit Position Info
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500">Department &amp; Type</div>
                          <div className="font-medium text-slate-900">
                            {department} · {jobType}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500">Workplace &amp; Location</div>
                          <div className="font-medium text-slate-900">
                            {workplace} —{' '}
                            {workplace === 'Remote'
                              ? 'Global Remote'
                              : locationText.trim() || 'Remote'}
                          </div>
                        </div>
                        <div className="space-y-0.5 sm:col-span-2">
                          <div className="text-xs text-slate-500">Candidate Eligibility</div>
                          <div className="font-medium text-slate-900">
                            {[
                              openToInternational
                                ? 'Open to International Candidates'
                                : 'Local Candidates Only',
                              openToContractors
                                ? 'Open to International Contractors'
                                : 'Full-time Employees Only',
                            ].join(' · ')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Compensation, Regions & Localization Review */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-500">
                          2. Pay, Regions &amp; Distribution
                        </h4>
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                        >
                          Edit Pay &amp; Details
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500">Annual Salary Range (USD)</div>
                          <div className="font-mono font-semibold text-slate-900 tabular-nums">
                            ${Math.round(salaryMin / 1000)}k – ${Math.round(salaryMax / 1000)}k
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500">Visa Policy</div>
                          <div className="font-medium text-slate-900">
                            {visaSponsored ? 'Visa sponsorship available' : 'Not available'}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500">English &amp; Auto-Translation</div>
                          <div className="font-medium text-slate-900">
                            {englishRequirement} · Auto-translation {autoTranslate ? 'On' : 'Off'}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-500">Target Overseas Regions</div>
                          <div className="font-medium text-slate-900">
                            {targetRegions.length > 0
                              ? targetRegions.join(' · ')
                              : 'Global Remote'}
                          </div>
                        </div>
                        <div className="space-y-0.5 sm:col-span-2">
                          <div className="text-xs text-slate-500">Syndicated Partner Platforms</div>
                          <div className="font-medium text-slate-900">
                            {connectedPlatforms.length > 0
                              ? connectedPlatforms.join(' · ')
                              : 'GlobalHire Network'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Candidate-Facing Posting Content Preview */}
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Candidate-Facing Listing Preview
                        </h4>
                        <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Live job card details
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-slate-500">Role Description</div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {jobDescription.trim()}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-slate-500">
                          Listed Requirements
                        </div>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>{department} domain experience</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>{englishRequirement} English communication</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>
                              {openToContractors
                                ? 'Open to international contractors and remote collaboration'
                                : 'Full-time international team collaboration'}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Pre-Publish Readiness Verification */}
                    <div className="p-4 sm:p-5 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        Posting verified for immediate publication
                      </span>
                      <span>
                        Recruiter contact: {profile.recruiterName} · {profile.headquarters}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Footer */}
              <div className="pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((wizardStep - 1) as 1 | 2 | 3)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreatingJob(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((wizardStep + 1) as 1 | 2 | 3)}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    {wizardStep === 2 ? 'Review Job Posting' : 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="min-h-[44px] px-6 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Post Job
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* SAVED TALENT TAB */}
      {activeTab === 'saved' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Shortlisted Candidates
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Candidates you saved for review or outreach.
            </p>
          </div>

          {(() => {
            const savedList = candidates.filter((c) => savedCandidateIds.includes(c.id));
            if (savedList.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                  <p className="font-display text-lg font-semibold text-slate-900">
                    No shortlisted candidates yet
                  </p>
                  <p className="text-sm text-slate-600">
                    Filter international candidates in the Candidates tab and click Save to build your shortlist.
                  </p>
                  <button
                    type="button"
                    onClick={() => onChangeTab('candidates')}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
                  >
                    Explore Candidates
                  </button>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedList.map((cand) => (
                  <div
                    key={cand.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      {renderAvatar(cand, 'w-12 h-12')}
                      <div>
                        <h2 className="font-display text-base font-semibold text-slate-900">
                          {cand.name}
                        </h2>
                        <p className="text-sm text-slate-700">{cand.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cand.city}, {cand.country} · {cand.yearsExperience} yrs
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenMessage(cand)}
                        className="min-h-[40px] px-4 py-1.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
                      >
                        Message
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCandidateId(cand.id);
                          setMobileDetailOpen(true);
                          onChangeTab('candidates');
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* EMPLOYER PROFILE TAB (Revision #1) */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <p className="text-xs font-medium text-blue-700">Employer Company Profile</p>
              <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
                {profile.companyName}
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Recruiter: {profile.recruiterName} · {profile.headquarters}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Edit Company Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">Target Hiring Regions</div>
              <div className="font-medium text-slate-900">
                {profile.hiringRegions.join(' · ')}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">Visa Sponsorship Policy</div>
              <div className="font-medium text-slate-900">
                {profile.supportsVisaSponsorship
                  ? 'Supports International Visa Sponsorship'
                  : 'Local Hiring Only'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">Contractor Policy</div>
              <div className="font-medium text-slate-900">
                {profile.supportsInternationalContractors
                  ? 'Open to Direct Hire & International Contractors'
                  : 'Full-time Employees Only'}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign Out to Login Screen
            </button>
          </div>
        </div>
      )}

      {/* CANDIDATE FILTER MODAL (Task 4 + Paper Prototype Page 4) */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Filter Candidates"
        >
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">Filter Candidates</h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Close candidate filters"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Location */}
              <div className="space-y-2">
                <label
                  htmlFor="cand-filter-country"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Location / Country
                </label>
                <select
                  id="cand-filter-country"
                  value={draftFilters.country}
                  onChange={(e) => setDraftFilters((d) => ({ ...d, country: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                >
                  <option value="All Regions">All Regions</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Canada">Canada</option>
                  <option value="Japan">Japan</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>

              {/* Technical Skills */}
              <div className="space-y-2.5">
                <label className="block text-sm font-semibold text-slate-900">
                  Technical Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => {
                    const active = draftFilters.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          setDraftFilters((d) => ({
                            ...d,
                            skills: active
                              ? d.skills.filter((s) => s !== skill)
                              : [...d.skills, skill],
                          }))
                        }
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          active
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2.5">
                <label className="block text-sm font-semibold text-slate-900">
                  Experience Level
                </label>
                <div className="space-y-2">
                  {(
                    [
                      'Entry (0-2 yrs)',
                      'Mid-Senior (3-5 yrs)',
                      'Senior (5+ yrs)',
                    ] as CandidateExpBucket[]
                  ).map((bucket) => {
                    const checked = draftFilters.experienceBuckets.includes(bucket);
                    return (
                      <label
                        key={bucket}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setDraftFilters((d) => ({
                              ...d,
                              experienceBuckets: checked
                                ? d.experienceBuckets.filter((x) => x !== bucket)
                                : [...d.experienceBuckets, bucket],
                            }))
                          }
                          className="w-4 h-4 accent-blue-700"
                        />
                        <span className="text-sm font-medium text-slate-800">{bucket}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Workplace & Language & Compliance Checkboxes */}
              <div className="space-y-2.5">
                <label className="block text-sm font-semibold text-slate-900">
                  Workplace, Language &amp; Compliance
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={draftFilters.openToRemoteOnly}
                    onChange={(e) =>
                      setDraftFilters((d) => ({ ...d, openToRemoteOnly: e.target.checked }))
                    }
                    className="w-4 h-4 accent-blue-700"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Open to remote / international work
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={draftFilters.englishProfessionalOnly}
                    onChange={(e) =>
                      setDraftFilters((d) => ({
                        ...d,
                        englishProfessionalOnly: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-blue-700"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    English (Professional proficiency or higher)
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={draftFilters.directHireOnly}
                    onChange={(e) =>
                      setDraftFilters((d) => ({ ...d, directHireOnly: e.target.checked }))
                    }
                    className="w-4 h-4 accent-blue-700"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Direct Hire Eligible
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={draftFilters.visaReadyOnly}
                    onChange={(e) =>
                      setDraftFilters((d) => ({ ...d, visaReadyOnly: e.target.checked }))
                    }
                    className="w-4 h-4 accent-blue-700"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Visa Sponsorship Ready
                  </span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyDraftFilters}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE MESSAGE MODAL */}
      {messageTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Message Candidate"
        >
          <form
            onSubmit={handleSubmitMessage}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Message {messageTarget.name}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {messageTarget.title} · {messageTarget.city}, {messageTarget.country}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMessageTarget(null)}
                aria-label="Close message dialog"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={4}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              required
              className="w-full p-3.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setMessageTarget(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      )}

      {/* JOB PUBLISHED CONFIRMATION POP-UP (Revision #5!) */}
      {publishedJobConfirmation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Job Successfully Posted"
        >
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Job Successfully Posted!
              </h2>
              <p className="text-sm text-slate-600">
                Your listing is now live on GlobalHire and visible to international candidates.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1 text-sm">
              <div className="font-display font-semibold text-slate-900">
                {publishedJobConfirmation.title}
              </div>
              <div className="text-slate-600">
                {publishedJobConfirmation.department} · {publishedJobConfirmation.workplace} (
                {publishedJobConfirmation.location})
              </div>
              <div className="text-xs text-emerald-700 font-medium pt-1">
                {publishedJobConfirmation.visaSponsored
                  ? 'Visa Sponsorship Available'
                  : 'Standard Authorization'}
                {publishedJobConfirmation.openToContractors
                  ? ' · Open to International Contractors'
                  : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  const job = publishedJobConfirmation;
                  setPublishedJobConfirmation(null);
                  setPreviewEmployerJob(job);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                View Posting
              </button>
              <button
                type="button"
                onClick={() => setPublishedJobConfirmation(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
              >
                Return to Jobs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYER JOB PREVIEW MODAL */}
      {previewEmployerJob && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Job Posting Preview"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-blue-700">
                  {previewEmployerJob.status} Posting · {previewEmployerJob.department}
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {previewEmployerJob.title}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {profile.companyName} · {previewEmployerJob.workplace} (
                  {previewEmployerJob.location})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmployerJob(null)}
                aria-label="Close job preview"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Salary Range (USD)</div>
                <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                  ${(previewEmployerJob.salaryMin / 1000).toFixed(0)}k – $
                  {(previewEmployerJob.salaryMax / 1000).toFixed(0)}k
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">English Requirement</div>
                <div className="font-medium text-slate-900 mt-0.5">
                  {previewEmployerJob.englishRequirement}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-sm font-semibold text-slate-900">Description</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {previewEmployerJob.description}
              </p>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="font-medium text-slate-900">International Preferences</div>
              <p className="text-slate-600">
                Regions: {previewEmployerJob.targetRegions.join(' · ')}
              </p>
              <p className="text-slate-600">
                Visa Sponsorship: {previewEmployerJob.visaSponsored ? 'Available' : 'Not offered'} ·
                International Contractors:{' '}
                {previewEmployerJob.openToContractors ? 'Open' : 'Not open'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewEmployerJob(null)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
