import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Languages,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import {
  ApplicationStatus,
  EmployeeProfile,
  ExperienceLevel,
  JobListing,
  JobType,
  RegionalPlatform,
  SubmittedApplication,
  WorkplaceType,
} from '../types';

export type JobSeekerTab = 'jobs' | 'regional' | 'saved' | 'applications' | 'profile';

interface JobSeekerWorkspaceProps {
  activeTab: JobSeekerTab;
  onChangeTab: (tab: JobSeekerTab) => void;
  jobs: JobListing[];
  regionalPlatforms: RegionalPlatform[];
  profile: EmployeeProfile;
  savedJobIds: string[];
  appliedJobIds: string[];
  submittedApplications: SubmittedApplication[];
  onToggleSaveJob: (jobId: string) => void;
  onApplyJob: (jobId: string, note?: string) => void;
  onWithdrawApplication: (applicationId: string) => void;
  onOpenOnboarding: () => void;
  onSignOut: () => void;
}

interface FilterState {
  jobTypes: JobType[];
  experienceLevels: ExperienceLevel[];
  location: string;
  workplaces: WorkplaceType[];
  minSalary: number;
  visaSponsoredOnly: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  jobTypes: [],
  experienceLevels: [],
  location: 'All Locations',
  workplaces: [],
  minSalary: 30000,
  visaSponsoredOnly: false,
};

export const JobSeekerWorkspace: React.FC<JobSeekerWorkspaceProps> = ({
  activeTab,
  onChangeTab,
  jobs,
  regionalPlatforms,
  profile,
  savedJobIds,
  appliedJobIds,
  submittedApplications,
  onToggleSaveJob,
  onApplyJob,
  onWithdrawApplication,
  onOpenOnboarding,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'salary'>('relevance');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id ?? '');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'description' | 'company'>('description');
  const [languageModeByJobId, setLanguageModeByJobId] = useState<
    Record<string, 'original' | 'en'>
  >({});

  // Apply modal
  const [applyModalJob, setApplyModalJob] = useState<JobListing | null>(null);
  const [applyNote, setApplyNote] = useState('');

  // Regional platform state
  const [regionFilter, setRegionFilter] = useState<'All' | 'Japan' | 'United States' | 'Brazil' | 'Europe'>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<RegionalPlatform | null>(null);
  const [savedPlatformIds, setSavedPlatformIds] = useState<string[]>([]);

  // Profile application tracker status filter
  const [appStatusFilter, setAppStatusFilter] = useState<'All' | ApplicationStatus>('All');

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.jobTypes.length;
    count += filters.experienceLevels.length;
    count += filters.workplaces.length;
    if (filters.location !== 'All Locations') count += 1;
    if (filters.minSalary > 30000) count += 1;
    if (filters.visaSponsoredOnly) count += 1;
    return count;
  }, [filters]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = jobs.filter((job) => {
      if (q) {
        const hay = `${job.title} ${job.company} ${job.location} ${job.country} ${job.department}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.jobType)) {
        return false;
      }
      if (
        filters.experienceLevels.length > 0 &&
        !filters.experienceLevels.includes(job.experienceLevel)
      ) {
        return false;
      }
      if (filters.location !== 'All Locations') {
        if (filters.location === 'Remote') {
          if (job.workplace !== 'Remote') return false;
        } else if (job.country !== filters.location) {
          return false;
        }
      }
      if (filters.workplaces.length > 0 && !filters.workplaces.includes(job.workplace)) {
        return false;
      }
      if (job.salaryMax < filters.minSalary) {
        return false;
      }
      if (filters.visaSponsoredOnly && !job.visaSponsored) {
        return false;
      }
      return true;
    });

    if (sortBy === 'salary') {
      return [...list].sort((a, b) => b.salaryMax - a.salaryMax);
    }
    return list;
  }, [jobs, searchQuery, filters, sortBy]);

  const selectedJob = useMemo(() => {
    const found = filteredJobs.find((j) => j.id === selectedJobId);
    return found ?? filteredJobs[0] ?? jobs.find((j) => j.id === selectedJobId) ?? null;
  }, [filteredJobs, selectedJobId, jobs]);

  const openFilters = () => {
    setDraftFilters(filters);
    setIsFilterOpen(true);
  };

  const applyDraftFilters = () => {
    setFilters(draftFilters);
    setIsFilterOpen(false);
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
    setIsFilterOpen(false);
  };

  const toggleDraftArray = <T extends string>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

  const handleSelectJob = (job: JobListing) => {
    setSelectedJobId(job.id);
    setDetailTab('description');
    setMobileDetailOpen(true);
  };

  const handleToggleLanguageMode = (job: JobListing) => {
    const defaultMode: 'original' | 'en' = job.originalLanguage === 'ja' ? 'original' : 'en';
    setLanguageModeByJobId((prev) => {
      const current = prev[job.id] ?? defaultMode;
      return {
        ...prev,
        [job.id]: current === 'original' ? 'en' : 'original',
      };
    });
  };

  const handleConfirmApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalJob) return;
    onApplyJob(applyModalJob.id, applyNote);
    setApplyModalJob(null);
    setApplyNote('');
  };

  const filteredPlatforms = useMemo(() => {
    if (regionFilter === 'All') return regionalPlatforms;
    return regionalPlatforms.filter((p) => p.country === regionFilter);
  }, [regionalPlatforms, regionFilter]);

  const renderJobDetailPanel = (job: JobListing) => {
    const hasOriginalContent = Boolean(job.originalContent && job.originalLanguage !== 'en');
    const defaultMode: 'original' | 'en' = job.originalLanguage === 'ja' ? 'original' : 'en';
    const activeMode = languageModeByJobId[job.id] ?? defaultMode;
    const showOriginal = Boolean(hasOriginalContent && activeMode === 'original');
    const orig = job.originalContent;

    const displayTitle = showOriginal && orig ? orig.title : job.title;
    const displayDepartment = showOriginal && orig ? orig.department : job.department;
    const displayLocation = showOriginal && orig ? orig.location : job.location;
    const displayVisaDetails = showOriginal && orig ? orig.visaDetails : job.visaDetails;
    const displayDescription =
      showOriginal && orig ? orig.description : job.descriptionEn;
    const displayRequirements =
      showOriginal && orig ? orig.requirements : job.requirementsEn;
    const displaySalaryBenchmark =
      showOriginal && orig ? orig.salaryBenchmark : job.companyInsights.salaryBenchmark;
    const displayCommunication =
      showOriginal && orig
        ? orig.workplaceCommunication
        : job.companyInsights.workplaceCommunication;
    const displayCultureSummary =
      showOriginal && orig ? orig.cultureSummary : job.companyInsights.cultureSummary;
    const displayBenefits =
      showOriginal && orig ? orig.benefits : job.companyInsights.benefits;
    const displayReviews =
      showOriginal && orig?.reviews
        ? job.companyInsights.reviews.map((rev) => {
            const origRev = orig.reviews?.find((r) => r.id === rev.id);
            return origRev ? { ...rev, ...origRev } : rev;
          })
        : job.companyInsights.reviews;

    const isSaved = savedJobIds.includes(job.id);
    const isApplied = appliedJobIds.includes(job.id);
    const linkedPlatforms = regionalPlatforms.filter((p) =>
      job.companyInsights.regionalPlatformIds.includes(p.id)
    );

    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Top Detail Header */}
        <div className="p-6 border-b border-slate-200 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              {mobileDetailOpen && (
                <button
                  type="button"
                  onClick={() => setMobileDetailOpen(false)}
                  className="lg:hidden min-h-[44px] -ml-2 px-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Jobs
                </button>
              )}
              <h2 className="font-display text-2xl font-bold text-slate-900 text-balance">
                {displayTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{job.company}</span>
                <span aria-hidden="true">·</span>
                <span>{displayDepartment}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {displayLocation}
                </span>
                <span aria-hidden="true">·</span>
                <span>{job.postedDate}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleSaveJob(job.id)}
              aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
              className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-lg border text-sm font-medium inline-flex items-center gap-2 transition-colors shrink-0 ${
                isSaved
                  ? 'border-blue-700 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-700 text-blue-700' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* Unboxed Metadata Line + Salary */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600">
              <span>{job.jobType}</span>
              <span aria-hidden="true">·</span>
              <span>{job.experienceLevel}</span>
              <span aria-hidden="true">·</span>
              <span>{job.workplace}</span>
              {job.visaSponsored && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    Visa Sponsored
                  </span>
                </>
              )}
            </div>
            <div className="font-mono text-base font-semibold text-slate-900 tabular-nums">
              {job.salaryDisplay}
            </div>
          </div>

          {/* Visa Sponsorship Summary Line */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-slate-900">Work Authorization: </span>
              <span>{displayVisaDetails}</span>
            </div>
          </div>

          {/* Segmented Description | Company Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-fit">
            <button
              type="button"
              onClick={() => setDetailTab('description')}
              className={`flex-1 sm:flex-initial min-h-[40px] px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                detailTab === 'description'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('company')}
              className={`flex-1 sm:flex-initial min-h-[40px] px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                detailTab === 'company'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Company &amp; Regional Insights
            </button>
          </div>
        </div>

        {/* Detail Body */}
        <div className="p-6 space-y-6">
          {/* Language Conversion Banner for International Postings (applies to description & all details) */}
          {hasOriginalContent && orig && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Languages className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="font-medium text-slate-900">
                  {showOriginal
                    ? `Showing original ${orig.languageLabel} listing`
                    : `Showing English translation (Original: ${orig.languageLabel})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleLanguageMode(job)}
                className="min-h-[40px] px-4 py-1.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                {showOriginal ? 'Translate to English' : 'Convert to Original Text'}
              </button>
            </div>
          )}

          {detailTab === 'description' ? (
            <>
              <section className="space-y-2.5">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Role Overview
                </h3>
                <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                  {displayDescription}
                </p>
              </section>

              <section className="space-y-2.5">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Key Requirements
                </h3>
                <ul className="space-y-2 text-sm sm:text-[15px] text-slate-700 list-disc pl-5">
                  {displayRequirements.map((req, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {req}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Quick Preview of Company Insights + Regional Link */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Salary Benchmark: </span>
                  {displaySalaryBenchmark}
                </div>
                <button
                  type="button"
                  onClick={() => setDetailTab('company')}
                  className="min-h-[44px] px-3 text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                >
                  View Company Reviews &amp; Regional Platforms →
                </button>
              </div>

              {/* Primary Apply CTA */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {isApplied ? (
                  <div className="min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Application Submitted
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setApplyModalJob(job)}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Company Insights & Regional Platforms (Tasks T2 & T3 + Revision #3) */
            <div className="space-y-6">
              {/* Expat & Cultural Health Metrics */}
              <section className="space-y-3">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Expat &amp; Cultural Health
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-medium text-slate-500">International Staff</div>
                    <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                      {job.companyInsights.foreignNationalsPct}%
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">Foreign nationals on team</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Workplace Communication
                    </div>
                    <div className="font-display text-base font-semibold text-slate-900 mt-1.5">
                      {displayCommunication}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">Primary daily language</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-medium text-slate-500">Employee &amp; Visa Rating</div>
                    <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums flex items-center gap-1.5">
                      <span>{job.companyInsights.employeeRating.toFixed(1)}</span>
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
                      {job.companyInsights.reviewCount} verified reviews · Visa{' '}
                      {job.companyInsights.visaSupportRating.toFixed(1)}/5
                    </div>
                  </div>
                </div>
              </section>

              {/* Salary & Workplace Culture */}
              <section className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Compensation &amp; Workplace Culture
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-medium text-slate-900">Salary Benchmark: </span>
                  {displaySalaryBenchmark}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {displayCultureSummary}
                </p>
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {displayBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Employee Reviews */}
              <section className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Employee Reviews
                </h3>
                {displayReviews.length > 0 ? (
                  <div className="space-y-3">
                    {displayReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {rev.headline}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums shrink-0">
                            {rev.rating}.0 / 5
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {rev.authorRole} · {rev.tenure}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed pt-1">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    Verified employee reviews are summarized in the overall rating above.
                  </p>
                )}
              </section>

              {/* Dedicated Regional Platforms Navigation Section (Revision #3!) */}
              <section className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      Regional Recruitment Platforms ({job.country})
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Trusted local hiring networks commonly used in {job.country}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        job.country === 'Japan' ||
                        job.country === 'United States' ||
                        job.country === 'Brazil'
                      ) {
                        setRegionFilter(job.country);
                      } else if (job.country === 'Germany') {
                        setRegionFilter('Europe');
                      } else {
                        setRegionFilter('All');
                      }
                      onChangeTab('regional');
                    }}
                    className="min-h-[40px] px-3 text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                  >
                    Explore All Regional Platforms →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkedPlatforms.map((plat) => (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => setSelectedPlatform(plat)}
                      className="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-700 hover:bg-blue-50/30 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-display text-sm font-semibold text-slate-900">
                          {plat.name}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">{plat.focus}</div>
                        <div className="text-xs text-slate-500 mt-1.5">
                          {plat.languageSupport} · {plat.activeTechRoles}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 space-y-6">
      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <div className="space-y-5">
          {/* Search + Prominent Filter Button Row (Revision #2) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search role, company, or location (e.g., Software Engineer, Tokyo)"
                  aria-label="Search jobs"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={openFilters}
                  className={`min-h-[46px] px-4 py-2 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                    activeFilterCount > 0
                      ? 'border-blue-700 bg-blue-50 text-blue-800'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="font-mono text-xs tabular-nums">({activeFilterCount})</span>
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'relevance' | 'salary')}
                  aria-label="Sort jobs"
                  className="min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="salary">Sort: Highest Salary</option>
                </select>
              </div>
            </div>

            {/* Active Filter Controls & Count */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {filters.jobTypes.map((jt) => (
                  <button
                    key={jt}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        jobTypes: f.jobTypes.filter((x) => x !== jt),
                      }))
                    }
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>{jt}</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
                {filters.experienceLevels.map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        experienceLevels: f.experienceLevels.filter((x) => x !== exp),
                      }))
                    }
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>{exp}</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
                {filters.location !== 'All Locations' && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, location: 'All Locations' }))}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>{filters.location}</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
                {filters.workplaces.map((wp) => (
                  <button
                    key={wp}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        workplaces: f.workplaces.filter((x) => x !== wp),
                      }))
                    }
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <span>{wp}</span>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
                {filters.visaSponsoredOnly && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, visaSponsoredOnly: false }))}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-medium text-blue-800 inline-flex items-center gap-1.5"
                  >
                    <span>Visa Sponsored</span>
                    <X className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                )}
                {filters.minSalary > 30000 && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, minSalary: 30000 }))}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5 tabular-nums"
                  >
                    <span>Min ${(filters.minSalary / 1000).toFixed(0)}k</span>
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
                <span className="font-semibold text-slate-900">{filteredJobs.length}</span>{' '}
                {filteredJobs.length === 1 ? 'job' : 'jobs'} found
              </div>
            </div>
          </div>

          {/* Master-Detail Desktop Grid (Responsive Mobile Stack) */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <p className="font-display text-lg font-semibold text-slate-900">
                No jobs match your current filters
              </p>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Try broadening your location, salary threshold, or experience level filters to see more international opportunities.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  clearAllFilters();
                }}
                className="min-h-[44px] px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
              >
                Reset Search &amp; Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Job List */}
              <div
                className={`lg:col-span-5 space-y-3 ${
                  mobileDetailOpen ? 'hidden lg:block' : 'block'
                }`}
              >
                {filteredJobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  const isSaved = savedJobIds.includes(job.id);
                  const isApplied = appliedJobIds.includes(job.id);

                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectJob(job);
                        }
                      }}
                      className={`p-5 rounded-2xl border bg-white cursor-pointer transition-colors space-y-3 ${
                        isSelected
                          ? 'border-blue-700 ring-1 ring-blue-700 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-semibold text-slate-900 truncate">
                            {job.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-0.5">
                            {job.company} · {job.location}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSaveJob(job.id);
                          }}
                          aria-label={isSaved ? 'Unsave job' : 'Save job'}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-100 shrink-0"
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              isSaved ? 'fill-blue-700 text-blue-700' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Clean unboxed metadata line */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                        <span>{job.jobType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.experienceLevel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.workplace}</span>
                        {job.originalLanguage !== 'en' && job.originalContent && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                              <Languages className="w-3.5 h-3.5" />
                              {job.originalContent.languageLabel} original available
                            </span>
                          </>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-sm">
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {job.salaryDisplay}
                        </span>
                        <div className="flex items-center gap-3 text-xs font-medium">
                          {job.visaSponsored && (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Visa Sponsored
                            </span>
                          )}
                          {isApplied && (
                            <span className="text-blue-700 font-semibold">Applied</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Selected Job Details */}
              <div
                className={`lg:col-span-7 lg:sticky lg:top-20 ${
                  mobileDetailOpen ? 'block' : 'hidden lg:block'
                }`}
              >
                {selectedJob && renderJobDetailPanel(selectedJob)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* REGIONAL PLATFORMS TAB (Task 3 + Revision #3) */}
      {activeTab === 'regional' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Regional Recruitment Platforms
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Explore vetted local job boards across major tech hubs, including language expectations, visa sponsorship support, and typical employer response times.
              </p>
            </div>

            {/* Region Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(['All', 'Japan', 'United States', 'Brazil', 'Europe'] as const).map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setRegionFilter(reg)}
                  className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    regionFilter === reg
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {reg === 'All' ? 'All Regions' : reg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlatforms.map((plat) => (
              <div
                key={plat.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900">
                        {plat.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {plat.country}
                        {plat.nativeName ? ` · ${plat.nativeName}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-700 tabular-nums shrink-0">
                      {plat.activeTechRoles}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">{plat.description}</p>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 pt-1">
                    <span>{plat.languageSupport}</span>
                    <span aria-hidden="true">·</span>
                    <span>Response: {plat.responseTime}</span>
                    <span aria-hidden="true">·</span>
                    <span className={plat.visaFriendly ? 'text-emerald-700 font-medium' : ''}>
                      {plat.visaFriendly ? 'Visa-friendly filter supported' : 'Local & startup focus'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(plat)}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors"
                  >
                    Review Platform Guide
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAVED TAB */}
      {activeTab === 'saved' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Saved Positions ({savedJobIds.length})
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Bookmarked international roles you want to revisit or apply to.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeTab('applications')}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap"
            >
              View Submitted Applications ({submittedApplications.length})
            </button>
          </div>

          {(() => {
            const list = jobs.filter((j) => savedJobIds.includes(j.id));
            if (list.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                  <p className="font-display text-lg font-semibold text-slate-900">
                    No saved jobs yet
                  </p>
                  <p className="text-sm text-slate-600">
                    Browse international openings in the Jobs tab to bookmark positions.
                  </p>
                  <button
                    type="button"
                    onClick={() => onChangeTab('jobs')}
                    className="min-h-[44px] px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
                  >
                    Browse Jobs
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <h2 className="font-display text-lg font-semibold text-slate-900">
                        {job.title}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {job.company} · {job.location}
                      </p>
                      <p className="text-xs text-slate-500">
                        {job.jobType} · {job.experienceLevel} ·{' '}
                        {job.visaSponsored ? 'Visa Sponsored' : 'Direct Hire'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {job.salaryDisplay}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleSaveJob(job.id)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setMobileDetailOpen(true);
                            onChangeTab('jobs');
                          }}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Saved Platforms Section */}
          <section aria-label="Saved Platforms" className="space-y-4 pt-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Saved Platforms ({savedPlatformIds.length})
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Regional recruitment platforms you bookmarked from platform guides.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChangeTab('regional')}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap"
              >
                Explore Regional Platforms
              </button>
            </div>

            {(() => {
              const savedPlats = regionalPlatforms.filter((p) => savedPlatformIds.includes(p.id));
              if (savedPlats.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <p className="font-display text-base font-semibold text-slate-900">
                      No saved regional platforms yet
                    </p>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      Open any platform guide in Regional Platforms and select Save Platform to bookmark it here.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPlats.map((plat) => (
                    <div
                      key={plat.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-lg font-semibold text-slate-900">
                              {plat.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {plat.country}
                              {plat.nativeName ? ` · ${plat.nativeName}` : ''}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-medium text-slate-700 tabular-nums shrink-0">
                            {plat.activeTechRoles}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{plat.description}</p>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                          <span>{plat.languageSupport}</span>
                          <span aria-hidden="true">·</span>
                          <span>Response: {plat.responseTime}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPlatform(plat)}
                          className="min-h-[40px] px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors"
                        >
                          Review Platform Guide
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSavedPlatformIds((prev) => prev.filter((id) => id !== plat.id))
                          }
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        </div>
      )}

      {/* SUBMITTED APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="max-w-4xl mx-auto space-y-5">
          <section
            aria-label="Submitted Applications Tracker"
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  Submitted Applications
                </h1>
                <p className="text-sm text-slate-600 mt-1 tabular-nums">
                  {submittedApplications.length}{' '}
                  {submittedApplications.length === 1 ? 'application' : 'applications'} tracked with
                  submission dates and current review status
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['All', 'Submitted', 'Under Review', 'Interview Scheduled'] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setAppStatusFilter(status)}
                      className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        appStatusFilter === status
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            {(() => {
              const filteredApps = submittedApplications.filter((app) =>
                appStatusFilter === 'All' ? true : app.status === appStatusFilter
              );

              if (filteredApps.length === 0) {
                return (
                  <div className="py-10 text-center border-t border-slate-100 space-y-3">
                    <p className="text-sm font-medium text-slate-900">
                      {submittedApplications.length === 0
                        ? 'You have not submitted any applications yet.'
                        : `No applications with status "${appStatusFilter}".`}
                    </p>
                    <button
                      type="button"
                      onClick={() => onChangeTab('jobs')}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium"
                    >
                      Browse Open Positions
                    </button>
                  </div>
                );
              }

              return (
                <div className="divide-y divide-slate-200 border-t border-slate-200">
                  {filteredApps.map((app) => {
                    const job = jobs.find((j) => j.id === app.jobId);
                    if (!job) return null;

                    return (
                      <div
                        key={app.id}
                        className="py-4 first:pt-4 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <h2 className="font-display text-base font-semibold text-slate-900">
                              {job.title}
                            </h2>
                            <span className="text-sm text-slate-600">· {job.company}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                            <span>{job.location}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-mono text-slate-700 tabular-nums">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Submitted {app.appliedDateDisplay}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                app.status === 'Interview Scheduled'
                                  ? 'text-emerald-700'
                                  : app.status === 'Under Review'
                                  ? 'text-blue-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {app.status === 'Interview Scheduled' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {app.status}
                            </span>
                          </div>

                          {app.note && (
                            <p className="text-xs text-slate-500 truncate max-w-xl">
                              Note: {app.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setMobileDetailOpen(true);
                              onChangeTab('jobs');
                            }}
                            className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                          >
                            View Job
                          </button>
                          <button
                            type="button"
                            onClick={() => onWithdrawApplication(app.id)}
                            className="min-h-[40px] px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap"
                          >
                            Withdraw
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        </div>
      )}

      {/* JOB SEEKER PROFILE TAB (Revision #1) */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-blue-700">Job Seeker Profile</p>
                <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
                  {profile.fullName}
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  {profile.preferredTitle} · {profile.currentCountry}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Experience Level</div>
                <div className="font-medium text-slate-900">{profile.yearsExperience}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Visa Sponsorship</div>
                <div className="font-medium text-slate-900">
                  {profile.requiresVisaSponsorship
                    ? 'Requires Employer Visa Sponsorship'
                    : 'Authorized without sponsorship'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Passport / Citizenship</div>
                <div className="font-medium text-slate-900">{profile.citizenship}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Workplace Preference</div>
                <div className="font-medium text-slate-900">{profile.workplacePreference}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Primary Languages</div>
                <div className="font-medium text-slate-900">{profile.languages.join(' · ')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Target Work Regions</div>
                <div className="font-medium text-slate-900">
                  {profile.targetRegions.join(' · ')}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="text-xs font-medium text-slate-500">Technical Skills</div>
              <div className="text-sm font-medium text-slate-900">{profile.skills.join(' · ')}</div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Resume: {profile.resumeFileName}</span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Sign Out to Login Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS MODAL / SLIDE-OVER PANEL (Revision #2) */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Job Filters"
        >
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">Filter Jobs</h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Close filters"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* 1. Job Type */}
              <div className="space-y-2.5">
                <label className="block text-sm font-semibold text-slate-900">Job Type</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['Full-time', 'Part-time', 'Contract'] as JobType[]).map((type) => {
                    const active = draftFilters.jobTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setDraftFilters((d) => ({
                            ...d,
                            jobTypes: toggleDraftArray(d.jobTypes, type),
                          }))
                        }
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          active
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Experience Level */}
              <div className="space-y-2.5">
                <label className="block text-sm font-semibold text-slate-900">
                  Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['Entry-level', 'Mid-level', 'Senior'] as ExperienceLevel[]).map((lvl) => {
                    const active = draftFilters.experienceLevels.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          setDraftFilters((d) => ({
                            ...d,
                            experienceLevels: toggleDraftArray(d.experienceLevels, lvl),
                          }))
                        }
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          active
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Location */}
              <div className="space-y-2">
                <label htmlFor="filter-location" className="block text-sm font-semibold text-slate-900">
                  Location
                </label>
                <select
                  id="filter-location"
                  value={draftFilters.location}
                  onChange={(e) => setDraftFilters((d) => ({ ...d, location: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                >
                  <option value="All Locations">All Locations</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Japan">Japan</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Germany">Germany</option>
                  <option value="Remote">Remote (Worldwide)</option>
                </select>
              </div>

              {/* Workplace */}
              <div className="space-y-2.5">
                <label className="block text-sm font-semibold text-slate-900">
                  Onsite / Remote
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['On-site', 'Remote', 'Hybrid'] as WorkplaceType[]).map((wp) => {
                    const active = draftFilters.workplaces.includes(wp);
                    return (
                      <button
                        key={wp}
                        type="button"
                        onClick={() =>
                          setDraftFilters((d) => ({
                            ...d,
                            workplaces: toggleDraftArray(d.workplaces, wp),
                          }))
                        }
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          active
                            ? 'border-blue-700 bg-blue-50 text-blue-800'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {wp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Salary Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="filter-salary" className="font-semibold text-slate-900">
                    Minimum Annual Salary
                  </label>
                  <span className="font-mono font-semibold text-blue-700 tabular-nums">
                    ${(draftFilters.minSalary / 1000).toFixed(0)}k+
                  </span>
                </div>
                <input
                  id="filter-salary"
                  type="range"
                  min={30000}
                  max={200000}
                  step={10000}
                  value={draftFilters.minSalary}
                  onChange={(e) =>
                    setDraftFilters((d) => ({ ...d, minSalary: Number(e.target.value) }))
                  }
                  className="w-full accent-blue-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 font-mono tabular-nums">
                  <span>$30k</span>
                  <span>$115k</span>
                  <span>$200k+</span>
                </div>
              </div>

              {/* 5. Visa Sponsorship Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Visa Sponsorship</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Only show employers offering work visa sponsorship
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftFilters.visaSponsoredOnly}
                  onClick={() =>
                    setDraftFilters((d) => ({
                      ...d,
                      visaSponsoredOnly: !d.visaSponsoredOnly,
                    }))
                  }
                  className={`w-12 h-7 rounded-full transition-colors p-0.5 shrink-0 ${
                    draftFilters.visaSponsoredOnly ? 'bg-blue-700' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      draftFilters.visaSponsoredOnly ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
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

      {/* APPLY MODAL */}
      {applyModalJob && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Apply for job"
        >
          <form
            onSubmit={handleConfirmApply}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Apply to {applyModalJob.company}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {applyModalJob.title} · {applyModalJob.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalJob(null)}
                aria-label="Close application modal"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="truncate font-medium text-slate-800">
                  {profile.resumeFileName}
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-medium shrink-0">Attached</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Note to Hiring Team (Optional)
              </label>
              <textarea
                rows={3}
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                placeholder="Highlight your experience, graduation date, or visa timeline..."
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApplyModalJob(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REGIONAL PLATFORM GUIDE MODAL (Task 3) */}
      {selectedPlatform && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Regional Platform Guide"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-blue-700">
                  Verified Regional Platform · {selectedPlatform.country}
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {selectedPlatform.name}
                </h2>
                {selectedPlatform.nativeName && (
                  <p className="text-xs text-slate-500 mt-0.5">{selectedPlatform.nativeName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlatform(null)}
                aria-label="Close platform guide"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">{selectedPlatform.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Language Support</div>
                <div className="font-medium text-slate-900 mt-0.5">
                  {selectedPlatform.languageSupport}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Typical Response</div>
                <div className="font-medium text-slate-900 mt-0.5">
                  {selectedPlatform.responseTime}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Verification &amp; Confidence Highlights
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {selectedPlatform.trustHighlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSavedPlatformIds((prev) =>
                    prev.includes(selectedPlatform.id)
                      ? prev.filter((id) => id !== selectedPlatform.id)
                      : [...prev, selectedPlatform.id]
                  );
                }}
                className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-medium inline-flex items-center gap-2 transition-colors ${
                  savedPlatformIds.includes(selectedPlatform.id)
                    ? 'border-blue-700 bg-blue-50 text-blue-800'
                    : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    savedPlatformIds.includes(selectedPlatform.id) ? 'fill-blue-700 text-blue-700' : ''
                  }`}
                />
                {savedPlatformIds.includes(selectedPlatform.id)
                  ? 'Saved to My Platforms'
                  : 'Save Platform'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatform(null);
                  onChangeTab('regional');
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Use {selectedPlatform.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
