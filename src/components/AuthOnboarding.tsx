import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Lock,
  Mail,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import {
  EmployeeProfile,
  EmployerProfile,
  UserRole,
  WorkplaceType,
} from '../types';

interface AuthOnboardingProps {
  initialMode?: 'login' | 'onboarding' | 'edit-profile';
  initialRole?: UserRole;
  initialEmail?: string;
  employeeProfile: EmployeeProfile;
  employerProfile: EmployerProfile;
  onCompleteLogin: (email: string) => boolean;
  onCompleteEmployeeOnboarding: (
    email: string,
    profile: EmployeeProfile,
    isEdit: boolean
  ) => void;
  onCompleteEmployerOnboarding: (
    email: string,
    profile: EmployerProfile,
    isEdit: boolean
  ) => void;
  onCancelEdit?: () => void;
}

export const AuthOnboarding: React.FC<AuthOnboardingProps> = ({
  initialMode = 'login',
  initialRole = 'employee',
  initialEmail = '',
  employeeProfile,
  employerProfile,
  onCompleteLogin,
  onCompleteEmployeeOnboarding,
  onCompleteEmployerOnboarding,
  onCancelEdit,
}) => {
  const [mode, setMode] = useState<'login' | 'onboarding' | 'edit-profile'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState(initialEmail);
  const [onboardingEmail, setOnboardingEmail] = useState(
    initialMode === 'edit-profile' ? initialEmail : ''
  );
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [onboardingNotice, setOnboardingNotice] = useState<string | null>(null);

  // 3-step onboarding state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Employee onboarding fields
  const [fullName, setFullName] = useState(employeeProfile.fullName);
  const [preferredTitle, setPreferredTitle] = useState(employeeProfile.preferredTitle);
  const [currentCountry, setCurrentCountry] = useState(employeeProfile.currentCountry);
  const [languages, setLanguages] = useState<string[]>(employeeProfile.languages);
  const [newLanguage, setNewLanguage] = useState('');
  const [showLanguageInput, setShowLanguageInput] = useState(false);

  const [yearsExperience, setYearsExperience] = useState(employeeProfile.yearsExperience);
  const [skills, setSkills] = useState<string[]>(employeeProfile.skills);
  const [newSkill, setNewSkill] = useState('');
  const [resumeFileName, setResumeFileName] = useState(employeeProfile.resumeFileName);

  const [requiresVisa, setRequiresVisa] = useState(employeeProfile.requiresVisaSponsorship);
  const [citizenship, setCitizenship] = useState(employeeProfile.citizenship);
  const [targetRegions, setTargetRegions] = useState<string[]>(employeeProfile.targetRegions);
  const [workplacePreference, setWorkplacePreference] = useState<WorkplaceType>(
    employeeProfile.workplacePreference
  );

  // Employer onboarding fields
  const [companyName, setCompanyName] = useState(employerProfile.companyName);
  const [recruiterName, setRecruiterName] = useState(employerProfile.recruiterName);
  const [headquarters, setHeadquarters] = useState(employerProfile.headquarters);
  const [hiringRegions, setHiringRegions] = useState<string[]>(employerProfile.hiringRegions);
  const [supportsVisa, setSupportsVisa] = useState(employerProfile.supportsVisaSponsorship);
  const [supportsContractors, setSupportsContractors] = useState(
    employerProfile.supportsInternationalContractors
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const ok = onCompleteLogin(email);
    if (!ok) {
      setLoginError(
        'No onboarded account matches that email. Complete Profile Onboarding first to assign your role.'
      );
    }
  };

  const startOnboarding = (prefillEmail = '') => {
    setLoginError(null);
    setOnboardingNotice(null);
    setOnboardingEmail(prefillEmail);
    setStep(1);
    setMode('onboarding');
  };

  const toggleRegion = (region: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(region)) {
      setter(list.filter((r) => r !== region));
    } else {
      setter([...list, region]);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleAddLanguage = () => {
    const trimmed = newLanguage.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
      setNewLanguage('');
      setShowLanguageInput(false);
    }
  };

  const handleCompleteOnboarding = () => {
    const isEdit = mode === 'edit-profile';
    const resolvedEmail =
      onboardingEmail.trim() ||
      (isEdit
        ? email
        : selectedRole === 'employee'
        ? `${(fullName.trim() || 'maya.lin').toLowerCase().replace(/[^a-z0-9]+/g, '.')}@globalhire.io`
        : `${(recruiterName.trim() || 'recruiter').toLowerCase().replace(/[^a-z0-9]+/g, '.')}@globalhire.io`);

    if (selectedRole === 'employee') {
      onCompleteEmployeeOnboarding(
        resolvedEmail,
        {
          fullName: fullName.trim() || 'Maya Lin',
          preferredTitle: preferredTitle.trim() || 'Software Engineer',
          currentCountry,
          languages,
          yearsExperience,
          skills,
          resumeFileName,
          requiresVisaSponsorship: requiresVisa,
          citizenship,
          targetRegions,
          workplacePreference,
        },
        isEdit
      );
    } else {
      onCompleteEmployerOnboarding(
        resolvedEmail,
        {
          companyName: companyName.trim() || 'Veloce Cloud Technologies',
          recruiterName: recruiterName.trim() || 'Jordan Vance',
          headquarters,
          hiringRegions,
          supportsVisaSponsorship: supportsVisa,
          supportsInternationalContractors: supportsContractors,
        },
        isEdit
      );
    }

    if (!isEdit) {
      setEmail(resolvedEmail);
      setLoginError(null);
      setOnboardingNotice(
        `Profile created for ${resolvedEmail} with role: ${
          selectedRole === 'employee' ? 'Job Seeker' : 'Employer'
        }. Sign in below to enter your workspace.`
      );
      setStep(1);
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Simple Top Bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <span className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            GlobalHire
          </span>
          {(mode === 'edit-profile' && onCancelEdit) || mode === 'onboarding' ? (
            <div className="flex items-center gap-4 text-sm text-slate-600">
              {mode === 'edit-profile' && onCancelEdit ? (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="min-h-[44px] px-3 font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Back to Workspace
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setStep(1);
                  }}
                  className="min-h-[44px] px-3 font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 lg:py-16 flex items-center">
        {mode === 'login' ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Editorial Column */}
            <div className="lg:col-span-7 space-y-8 pt-2">
              <div className="space-y-4">
                <p className="text-sm font-medium text-blue-700">
                  Cross-Border Career &amp; Talent Platform
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.15] text-balance max-w-2xl">
                  International hiring without language or visa guesswork.
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                  Search visa-sponsored engineering roles, translate foreign-language job descriptions, explore trusted local job boards, or recruit verified international talent.
                </p>
              </div>


              {/* Clean unboxed proof summary */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 tabular-nums">
                <span>41,000+ international listings</span>
                <span aria-hidden="true">·</span>
                <span>Verified visa sponsorship filters</span>
                <span aria-hidden="true">·</span>
                <span>4 regional partner networks</span>
              </div>
            </div>

            {/* Right Sign In Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="space-y-1 mb-6">
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Sign In to GlobalHire
                  </h2>
                  <p className="text-sm text-slate-600">
                    Enter your onboarded email to open your assigned workspace.
                  </p>
                </div>

                {onboardingNotice && (
                  <div
                    role="status"
                    className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed"
                  >
                    {onboardingNotice}
                  </div>
                )}

                {loginError && (
                  <div
                    role="alert"
                    className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2"
                  >
                    <p>{loginError}</p>
                    <button
                      type="button"
                      onClick={() => startOnboarding(email)}
                      className="font-semibold text-blue-700 hover:text-blue-800 underline"
                    >
                      Start Profile Onboarding with {email || 'new account'}
                    </button>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setLoginError(null);
                        }}
                        placeholder="you@example.com"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full min-h-[44px] pl-10 pr-11 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[48px] px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Log In
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-600">New to GlobalHire?</span>
                  <button
                    type="button"
                    onClick={() => startOnboarding('')}
                    className="min-h-[44px] px-3 font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
                  >
                    Sign Up &amp; Set Up Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 3-Step Profile Onboarding (Revision #1 & Paper Prototype Page 1) */
          <div className="w-full max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  {mode === 'edit-profile' ? 'Update Profile' : 'Profile Onboarding'}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  {mode === 'edit-profile'
                    ? `Update your ${
                        selectedRole === 'employee' ? 'Job Seeker' : 'Employer'
                      } preferences`
                    : 'Assign your role and configure your international preferences'}
                </p>
              </div>

              {/* Role Assignment Control (only during Onboarding, never in Edit Profile) */}
              {mode === 'onboarding' ? (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('employee');
                      setStep(1);
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      selectedRole === 'employee'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Job Seeker
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('employer');
                      setStep(1);
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      selectedRole === 'employer'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Employer
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-600">
                  Assigned Role · {selectedRole === 'employee' ? 'Job Seeker' : 'Employer'}
                </span>
              )}
            </div>

            {/* Step Progress Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 tabular-nums">
                <span>Step {step} of 3</span>
                <span>
                  {step === 1
                    ? 'Account & Basic Details'
                    : step === 2
                    ? selectedRole === 'employee'
                      ? 'Work Experience & Skills'
                      : 'Hiring Scope & Regions'
                    : 'International Preferences'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 transition-all duration-200"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Account Email in Step 1 of Onboarding */}
            {mode === 'onboarding' && step === 1 && (
              <div className="space-y-1.5 pt-2">
                <label htmlFor="onboarding-email" className="block text-sm font-medium text-slate-700">
                  Account Email (used for Sign In)
                </label>
                <input
                  id="onboarding-email"
                  type="email"
                  value={onboardingEmail}
                  onChange={(e) => setOnboardingEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'employee'
                      ? 'e.g., alex.chen@example.com'
                      : 'e.g., hiring@acmecloud.io'
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {/* Step Content */}
            {selectedRole === 'employee' ? (
              <>
                {step === 1 && (
                  <div className="space-y-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Maya Lin"
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Preferred Job Title
                      </label>
                      <input
                        type="text"
                        value={preferredTitle}
                        onChange={(e) => setPreferredTitle(e.target.value)}
                        placeholder="e.g., Software Engineer"
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Current Country
                      </label>
                      <select
                        value={currentCountry}
                        onChange={(e) => setCurrentCountry(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option>United States (F-1 CS Graduate)</option>
                        <option>United States</option>
                        <option>Japan</option>
                        <option>Brazil</option>
                        <option>Taiwan</option>
                        <option>India</option>
                        <option>Germany</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Primary Languages
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() =>
                              setLanguages(languages.filter((item) => item !== lang))
                            }
                            className="min-h-[40px] px-3 py-1.5 text-sm bg-slate-100 text-slate-800 rounded-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-200"
                          >
                            <Check className="w-3.5 h-3.5 text-blue-700" />
                            <span>{lang}</span>
                            <X className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        ))}
                      </div>
                      {showLanguageInput ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            placeholder="Add language (e.g., Japanese)"
                            className="flex-1 min-h-[44px] px-3 text-sm border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleAddLanguage}
                            className="min-h-[44px] px-4 text-sm font-medium bg-slate-900 text-white rounded-lg"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowLanguageInput(true)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
                        >
                          <Plus className="w-4 h-4" />
                          Add new language
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Years of Experience
                      </label>
                      <select
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option>0–2 years (Entry-level)</option>
                        <option>3–5 years (Mid-Senior)</option>
                        <option>5+ years (Senior)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Primary Skills
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => setSkills(skills.filter((s) => s !== skill))}
                            className="min-h-[40px] px-3 py-1.5 text-sm bg-slate-100 text-slate-800 rounded-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-200"
                          >
                            <span>{skill}</span>
                            <X className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                          placeholder="+ Add skill (e.g., Go, Docker)"
                          className="flex-1 min-h-[44px] px-3.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="min-h-[44px] px-4 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
                        >
                          Add Skill
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Resume Attachment
                      </label>
                      <label className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                        <Upload className="w-5 h-5 text-slate-500 mb-2" />
                        <span className="text-sm font-medium text-slate-800">
                          {resumeFileName || 'Select PDF, JPG, or PNG resume'}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Accepted: PDF / JPG / PNG (Click to change file)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setResumeFileName(file.name);
                          }}
                        />
                      </label>
                      {resumeFileName && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <FileText className="w-4 h-4 text-blue-700" />
                          <span>Attached: {resumeFileName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5 pt-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Require Visa Sponsorship?
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRequiresVisa(true)}
                          className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            requiresVisa
                              ? 'border-blue-700 bg-blue-50 text-blue-800'
                              : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          {requiresVisa && <Check className="w-4 h-4" />}
                          Yes, required
                        </button>
                        <button
                          type="button"
                          onClick={() => setRequiresVisa(false)}
                          className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            !requiresVisa
                              ? 'border-blue-700 bg-blue-50 text-blue-800'
                              : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          {!requiresVisa && <Check className="w-4 h-4" />}
                          No, authorized
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Passport / Citizenship
                      </label>
                      <select
                        value={citizenship}
                        onChange={(e) => setCitizenship(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                      >
                        <option>Taiwan</option>
                        <option>Brazil</option>
                        <option>India</option>
                        <option>Japan</option>
                        <option>China</option>
                        <option>Canada</option>
                        <option>United States</option>
                        <option>Germany</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Target Work Regions
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {['United States', 'Japan', 'Brazil', 'Europe'].map((region) => {
                          const active = targetRegions.includes(region);
                          return (
                            <button
                              key={region}
                              type="button"
                              onClick={() => toggleRegion(region, targetRegions, setTargetRegions)}
                              className={`min-h-[44px] px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                active
                                  ? 'border-blue-700 bg-blue-50 text-blue-800'
                                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                              <span>{region}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Workplace Preference
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['Remote', 'Hybrid', 'On-site'] as WorkplaceType[]).map((wp) => (
                          <button
                            key={wp}
                            type="button"
                            onClick={() => setWorkplacePreference(wp)}
                            className={`min-h-[44px] px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              workplacePreference === wp
                                ? 'border-blue-700 bg-blue-50 text-blue-800'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {wp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Employer 3-Step Onboarding */
              <>
                {step === 1 && (
                  <div className="space-y-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Recruiter / Hiring Manager Name
                      </label>
                      <input
                        type="text"
                        value={recruiterName}
                        onChange={(e) => setRecruiterName(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Headquarters Location
                      </label>
                      <input
                        type="text"
                        value={headquarters}
                        onChange={(e) => setHeadquarters(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5 pt-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Target International Hiring Regions
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          'Global Remote',
                          'Latin America',
                          'Japan',
                          'United States',
                          'Europe',
                          'Southeast Asia',
                        ].map((region) => {
                          const active = hiringRegions.includes(region);
                          return (
                            <button
                              key={region}
                              type="button"
                              onClick={() => toggleRegion(region, hiringRegions, setHiringRegions)}
                              className={`min-h-[44px] px-3 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 ${
                                active
                                  ? 'border-blue-700 bg-blue-50 text-blue-800'
                                  : 'border-slate-300 bg-white text-slate-700'
                              }`}
                            >
                              {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                              <span>{region}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 pt-2">
                    <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={supportsVisa}
                        onChange={(e) => setSupportsVisa(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-blue-700"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-slate-900">
                          Company provides Visa Sponsorship
                        </span>
                        <span className="block text-xs text-slate-600 mt-0.5">
                          Highlight H-1B, COE, or EU Blue Card sponsorship availability on job posts.
                        </span>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={supportsContractors}
                        onChange={(e) => setSupportsContractors(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-blue-700"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-slate-900">
                          Open to Direct Hire &amp; International Contractors
                        </span>
                        <span className="block text-xs text-slate-600 mt-0.5">
                          Allow remote engineers outside headquarters to apply directly.
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Step Navigation Footer */}
            <div className="pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                  className="min-h-[44px] px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="min-h-[44px] px-6 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Complete Profile
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
