import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Briefcase,
  CheckCircle2,
  Compass,
  FileText,
  User,
  Users,
} from 'lucide-react';
import { AuthOnboarding } from './components/AuthOnboarding';
import { EmployerTab, EmployerWorkspace } from './components/EmployerWorkspace';
import { JobSeekerTab, JobSeekerWorkspace } from './components/JobSeekerWorkspace';
import {
  DEFAULT_EMPLOYEE_PROFILE,
  DEFAULT_EMPLOYER_PROFILE,
  INITIAL_CANDIDATES,
  INITIAL_EMPLOYER_JOBS,
  INITIAL_JOBS,
  INITIAL_SUBMITTED_APPLICATIONS,
  REGIONAL_PLATFORMS,
} from './data/mockData';
import {
  AccountRecord,
  EmployeeProfile,
  EmployerJobItem,
  EmployerProfile,
  JobListing,
  SubmittedApplication,
  UserRole,
} from './types';

export default function App() {
  const [screenMode, setScreenMode] = useState<
    'login' | 'onboarding' | 'edit-profile' | 'workspace'
  >('login');
  const [role, setRole] = useState<UserRole>('employee');
  const [activeEmail, setActiveEmail] = useState<string>('');

  const [jobSeekerTab, setJobSeekerTab] = useState<JobSeekerTab>('jobs');
  const [employerTab, setEmployerTab] = useState<EmployerTab>('candidates');

  const [employeeProfile, setEmployeeProfile] =
    useState<EmployeeProfile>(DEFAULT_EMPLOYEE_PROFILE);
  const [employerProfile, setEmployerProfile] =
    useState<EmployerProfile>(DEFAULT_EMPLOYER_PROFILE);

  const [accounts, setAccounts] = useState<AccountRecord[]>([
    {
      email: 'maya.lin@nyu.edu',
      role: 'employee',
      displayName: DEFAULT_EMPLOYEE_PROFILE.fullName,
      employeeProfile: DEFAULT_EMPLOYEE_PROFILE,
    },
    {
      email: 'jordan@velocecloud.io',
      role: 'employer',
      displayName: DEFAULT_EMPLOYER_PROFILE.recruiterName,
      employerProfile: DEFAULT_EMPLOYER_PROFILE,
    },
  ]);

  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);
  const [employerJobs, setEmployerJobs] = useState<EmployerJobItem[]>(INITIAL_EMPLOYER_JOBS);

  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [submittedApplications, setSubmittedApplications] = useState<SubmittedApplication[]>(
    INITIAL_SUBMITTED_APPLICATIONS
  );
  const appliedJobIds = submittedApplications.map((a) => a.jobId);
  const [savedCandidateIds, setSavedCandidateIds] = useState<string[]>([]);
  const [messagedCandidateIds, setMessagedCandidateIds] = useState<string[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleCompleteLogin = (emailInput: string): boolean => {
    const normalized = emailInput.trim().toLowerCase();
    const matchedAccount = accounts.find(
      (acc) => acc.email.toLowerCase() === normalized
    );
    if (!matchedAccount) {
      return false;
    }

    setActiveEmail(matchedAccount.email);
    setRole(matchedAccount.role);
    if (matchedAccount.role === 'employee' && matchedAccount.employeeProfile) {
      setEmployeeProfile(matchedAccount.employeeProfile);
      setJobSeekerTab('jobs');
    } else if (matchedAccount.role === 'employer' && matchedAccount.employerProfile) {
      setEmployerProfile(matchedAccount.employerProfile);
      setEmployerTab('candidates');
    }
    setScreenMode('workspace');
    showToast(
      `Signed in as ${matchedAccount.displayName} (${
        matchedAccount.role === 'employee' ? 'Job Seeker' : 'Employer'
      })`
    );
    return true;
  };

  const handleCompleteEmployeeOnboarding = (
    emailInput: string,
    updated: EmployeeProfile,
    isEdit: boolean
  ) => {
    setEmployeeProfile(updated);
    setActiveEmail(emailInput);
    setAccounts((prev) => {
      const normalized = emailInput.trim().toLowerCase();
      const record: AccountRecord = {
        email: emailInput.trim(),
        role: 'employee',
        displayName: updated.fullName,
        employeeProfile: updated,
      };
      const exists = prev.some((acc) => acc.email.toLowerCase() === normalized);
      return exists
        ? prev.map((acc) => (acc.email.toLowerCase() === normalized ? record : acc))
        : [...prev, record];
    });
    if (isEdit) {
      setRole('employee');
      setScreenMode('workspace');
      showToast('Job Seeker profile updated');
    } else {
      showToast('Job Seeker role assigned — sign in to continue');
    }
  };

  const handleCompleteEmployerOnboarding = (
    emailInput: string,
    updated: EmployerProfile,
    isEdit: boolean
  ) => {
    setEmployerProfile(updated);
    setActiveEmail(emailInput);
    setAccounts((prev) => {
      const normalized = emailInput.trim().toLowerCase();
      const record: AccountRecord = {
        email: emailInput.trim(),
        role: 'employer',
        displayName: updated.recruiterName,
        employerProfile: updated,
      };
      const exists = prev.some((acc) => acc.email.toLowerCase() === normalized);
      return exists
        ? prev.map((acc) => (acc.email.toLowerCase() === normalized ? record : acc))
        : [...prev, record];
    });
    if (isEdit) {
      setRole('employer');
      setScreenMode('workspace');
      showToast('Employer profile updated');
    } else {
      showToast('Employer role assigned — sign in to continue');
    }
  };

  const handleToggleSaveJob = (jobId: string) => {
    setSavedJobIds((prev) => {
      const exists = prev.includes(jobId);
      showToast(exists ? 'Removed from saved jobs' : 'Job saved to your list');
      return exists ? prev.filter((id) => id !== jobId) : [...prev, jobId];
    });
  };

  const handleApplyJob = (jobId: string, note?: string) => {
    setSubmittedApplications((prev) => {
      if (prev.some((a) => a.jobId === jobId)) return prev;
      const now = new Date();
      const newApp: SubmittedApplication = {
        id: `app-${Date.now()}`,
        jobId,
        appliedDateIso: now.toISOString().slice(0, 10),
        appliedDateDisplay: now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: 'Submitted',
        resumeFileName: employeeProfile.resumeFileName,
        note: note?.trim() || undefined,
      };
      return [newApp, ...prev];
    });
    const job = jobs.find((j) => j.id === jobId);
    showToast(job ? `Application submitted to ${job.company}` : 'Application submitted');
  };

  const handleWithdrawApplication = (applicationId: string) => {
    setSubmittedApplications((prev) => prev.filter((a) => a.id !== applicationId));
    showToast('Application withdrawn');
  };

  const handleToggleSaveCandidate = (candidateId: string) => {
    setSavedCandidateIds((prev) => {
      const exists = prev.includes(candidateId);
      showToast(exists ? 'Removed from shortlist' : 'Candidate saved to shortlist');
      return exists ? prev.filter((id) => id !== candidateId) : [...prev, candidateId];
    });
  };

  const handleSendMessageCandidate = (candidateId: string) => {
    setMessagedCandidateIds((prev) => (prev.includes(candidateId) ? prev : [...prev, candidateId]));
    const cand = INITIAL_CANDIDATES.find((c) => c.id === candidateId);
    showToast(cand ? `Message sent to ${cand.name}` : 'Message sent');
  };

  const handlePublishJob = (newEmpJob: EmployerJobItem) => {
    setEmployerJobs((prev) => [newEmpJob, ...prev]);

    // Sync newly published job into live Job Seeker catalog
    const syncedListing: JobListing = {
      id: newEmpJob.id,
      title: newEmpJob.title,
      company: employerProfile.companyName,
      department: newEmpJob.department,
      location: newEmpJob.location,
      country: 'Global',
      jobType: newEmpJob.jobType,
      experienceLevel: 'Mid-level',
      workplace: newEmpJob.workplace,
      salaryMin: newEmpJob.salaryMin,
      salaryMax: newEmpJob.salaryMax,
      salaryDisplay: `$${Math.round(newEmpJob.salaryMin / 1000)}k – $${Math.round(
        newEmpJob.salaryMax / 1000
      )}k`,
      visaSponsored: newEmpJob.visaSponsored,
      visaDetails: newEmpJob.visaSponsored
        ? 'Visa sponsorship available · Open to international candidates'
        : 'Remote international direct hire',
      openToContractors: newEmpJob.openToContractors,
      englishRequirement: newEmpJob.englishRequirement,
      postedDate: 'Just now',
      originalLanguage: 'en',
      descriptionEn: newEmpJob.description,
      requirementsEn: [
        `${newEmpJob.department} domain experience`,
        `${newEmpJob.englishRequirement} English communication`,
        newEmpJob.openToContractors
          ? 'Open to international contractors and remote collaboration'
          : 'Full-time international team collaboration',
      ],
      companyInsights: {
        foreignNationalsPct: 45,
        workplaceCommunication: newEmpJob.englishRequirement,
        visaSupportRating: newEmpJob.visaSponsored ? 4.8 : 4.2,
        employeeRating: 4.6,
        reviewCount: 42,
        salaryBenchmark: `$${Math.round(newEmpJob.salaryMin / 1000)}k – $${Math.round(
          newEmpJob.salaryMax / 1000
        )}k USD`,
        cultureSummary: `${employerProfile.companyName} hires across ${newEmpJob.targetRegions.join(
          ', '
        )} with distributed engineering workflows.`,
        benefits: [
          newEmpJob.visaSponsored
            ? 'Employer-supported work visa sponsorship'
            : 'Remote contractor flexibility',
          'Distributed remote onboarding',
        ],
        reviews: [],
        regionalPlatformIds: ['doda-japan', 'otta-us'],
      },
    };
    setJobs((prev) => [syncedListing, ...prev]);
  };

  if (screenMode !== 'workspace') {
    return (
      <AuthOnboarding
        initialMode={
          screenMode === 'edit-profile'
            ? 'edit-profile'
            : screenMode === 'onboarding'
            ? 'onboarding'
            : 'login'
        }
        initialRole={role}
        initialEmail={activeEmail}
        employeeProfile={employeeProfile}
        employerProfile={employerProfile}
        onCompleteLogin={handleCompleteLogin}
        onCompleteEmployeeOnboarding={handleCompleteEmployeeOnboarding}
        onCompleteEmployerOnboarding={handleCompleteEmployerOnboarding}
        onCancelEdit={() => setScreenMode('workspace')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() =>
              role === 'employee' ? setJobSeekerTab('jobs') : setEmployerTab('candidates')
            }
            className="font-display text-lg md:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            GlobalHire
          </button>

          {/* Zone 2: 4 Single-line Nav Links */}
          {role === 'employee' ? (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {(
                [
                  { id: 'jobs', label: 'Jobs' },
                  { id: 'regional', label: 'Regional Platforms' },
                  { id: 'saved', label: 'Saved' },
                  { id: 'applications', label: 'Applications' },
                  { id: 'profile', label: 'Profile' },
                ] as { id: JobSeekerTab; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setJobSeekerTab(item.id)}
                  className={`min-h-[44px] px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    jobSeekerTab === item.id
                      ? 'border-blue-700 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {(
                [
                  { id: 'candidates', label: 'Candidates' },
                  { id: 'jobs', label: 'Job Postings' },
                  { id: 'saved', label: 'Saved Talent' },
                  { id: 'profile', label: 'Company Profile' },
                ] as { id: EmployerTab; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEmployerTab(item.id)}
                  className={`min-h-[44px] px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    employerTab === item.id
                      ? 'border-blue-700 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Zone 3: 1 Primary Action */}
          <button
            type="button"
            onClick={() => setScreenMode('login')}
            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1">
        {role === 'employee' ? (
          <JobSeekerWorkspace
            activeTab={jobSeekerTab}
            onChangeTab={setJobSeekerTab}
            jobs={jobs}
            regionalPlatforms={REGIONAL_PLATFORMS}
            profile={employeeProfile}
            savedJobIds={savedJobIds}
            appliedJobIds={appliedJobIds}
            submittedApplications={submittedApplications}
            onToggleSaveJob={handleToggleSaveJob}
            onApplyJob={handleApplyJob}
            onWithdrawApplication={handleWithdrawApplication}
            onOpenOnboarding={() => setScreenMode('edit-profile')}
            onSignOut={() => setScreenMode('login')}
          />
        ) : (
          <EmployerWorkspace
            activeTab={employerTab}
            onChangeTab={setEmployerTab}
            candidates={INITIAL_CANDIDATES}
            employerJobs={employerJobs}
            profile={employerProfile}
            savedCandidateIds={savedCandidateIds}
            messagedCandidateIds={messagedCandidateIds}
            onToggleSaveCandidate={handleToggleSaveCandidate}
            onSendMessageCandidate={handleSendMessageCandidate}
            onPublishJob={handlePublishJob}
            onOpenOnboarding={() => setScreenMode('edit-profile')}
            onSignOut={() => setScreenMode('login')}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar (< md, stays within 15% mobile sticky cap together with top bar) */}
      <nav
        aria-label="Mobile Navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid items-center ${
          role === 'employee' ? 'grid-cols-5' : 'grid-cols-4'
        }`}
      >
        {role === 'employee' ? (
          <>
            <button
              type="button"
              onClick={() => setJobSeekerTab('jobs')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                jobSeekerTab === 'jobs' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-[11px] font-medium">Jobs</span>
            </button>
            <button
              type="button"
              onClick={() => setJobSeekerTab('regional')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                jobSeekerTab === 'regional' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[11px] font-medium">Regional</span>
            </button>
            <button
              type="button"
              onClick={() => setJobSeekerTab('saved')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                jobSeekerTab === 'saved' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span className="text-[11px] font-medium">Saved</span>
            </button>
            <button
              type="button"
              onClick={() => setJobSeekerTab('applications')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                jobSeekerTab === 'applications' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[11px] font-medium">Applied</span>
            </button>
            <button
              type="button"
              onClick={() => setJobSeekerTab('profile')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                jobSeekerTab === 'profile' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[11px] font-medium">Profile</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEmployerTab('candidates')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                employerTab === 'candidates' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[11px] font-medium">Candidates</span>
            </button>
            <button
              type="button"
              onClick={() => setEmployerTab('jobs')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                employerTab === 'jobs' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-[11px] font-medium">Jobs</span>
            </button>
            <button
              type="button"
              onClick={() => setEmployerTab('saved')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                employerTab === 'saved' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span className="text-[11px] font-medium">Saved</span>
            </button>
            <button
              type="button"
              onClick={() => setEmployerTab('profile')}
              className={`h-full flex flex-col items-center justify-center gap-1 ${
                employerTab === 'profile' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[11px] font-medium">Profile</span>
            </button>
          </>
        )}
      </nav>

      {/* Subtle Action Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium inline-flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
