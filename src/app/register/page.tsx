'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import {
  OFFICIAL_EVENTS,
  calculateRegistrationPrice,
  EVENT_INFO,
  EventDefinition,
} from '@/lib/constants';
import {
  Shield,
  CheckCircle2,
  Users,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  QrCode,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Lock,
} from 'lucide-react';

interface TeamMemberInput {
  fullName: string;
  email: string;
  phone: string;
  usn: string;
  college: string;
  department: string;
  yearSemester: string;
}

function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEvent = searchParams.get('event');

  // Step state: 1 = Event Selection, 2 = Participant Details, 3 = Team Details (if applicable), 4 = Payment & Summary
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    initialEvent && OFFICIAL_EVENTS.some((e) => e.id === initialEvent) ? [initialEvent] : []
  );

  const [participant, setParticipant] = useState({
    fullName: '',
    email: '',
    phone: '',
    usn: '',
    college: 'Guru Nanak Dev Engineering College, Bidar',
    department: 'Computer Science and Engineering',
    yearSemester: '3rd Year (5th Sem)',
    githubProfile: '',
    linkedinProfile: '',
  });

  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>([]);

  const [transactionId, setTransactionId] = useState('');
  const [screenshotData, setScreenshotData] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');

  // UI status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Dynamic Pricing
  const pricing = calculateRegistrationPrice(selectedEventIds);

  // Does selection contain team event?
  const hasTeamEvent =
    selectedEventIds.includes('mini-hackathon') || selectedEventIds.includes('cyber-hunt');

  const toggleEvent = (id: string) => {
    setErrors({});
    setServerError(null);
    if (selectedEventIds.includes(id)) {
      setSelectedEventIds(selectedEventIds.filter((e) => e !== id));
    } else {
      setSelectedEventIds([...selectedEventIds, id]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, screenshot: 'Screenshot file must be under 5MB.' }));
      return;
    }

    // Validate format
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        screenshot: 'Allowed formats: PNG, JPG, JPEG, WEBP.',
      }));
      return;
    }

    setScreenshotName(file.name);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.screenshot;
      return next;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setScreenshotData(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const addTeamMember = () => {
    if (teamMembers.length >= 3) return; // Leader (1) + 3 members = max 4
    setTeamMembers([
      ...teamMembers,
      {
        fullName: '',
        email: '',
        phone: '',
        usn: '',
        college: participant.college || '',
        department: participant.department || '',
        yearSemester: participant.yearSemester || '',
      },
    ]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMemberInput, val: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: val };
    setTeamMembers(updated);
  };

  // Step Navigation & Validation
  const handleNext = () => {
    setErrors({});
    setServerError(null);

    // Step 1 Validation
    if (currentStep === 1) {
      if (selectedEventIds.length === 0) {
        setErrors({ events: 'Please select at least 1 event to register.' });
        return;
      }
      if (!pricing.canProceed) {
        setErrors({
          pricing:
            pricing.notice ||
            'Registration is blocked for this event combination until pricing is configured by organizers.',
        });
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Step 2 Validation
    if (currentStep === 2) {
      const newErrors: Record<string, string> = {};
      if (!participant.fullName.trim()) newErrors.fullName = 'Full Name is required.';
      if (!participant.email.trim() || !participant.email.includes('@'))
        newErrors.email = 'Valid email is required.';
      if (!participant.phone.trim() || participant.phone.length < 10)
        newErrors.phone = 'Valid 10-digit phone number is required.';
      if (!participant.usn.trim() || participant.usn.length < 3)
        newErrors.usn = 'USN / Student ID is required.';
      if (!participant.college.trim()) newErrors.college = 'College name is required.';
      if (!participant.department.trim()) newErrors.department = 'Department is required.';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      if (hasTeamEvent) {
        setCurrentStep(3); // Go to Team Step
      } else {
        setCurrentStep(4); // Skip to Payment
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Step 3 Validation (Team)
    if (currentStep === 3) {
      const newErrors: Record<string, string> = {};
      if (!teamName.trim()) {
        newErrors.teamName = 'Team Name is required for team competitions.';
      }

      // Check duplicates between leader and members
      const usnSet = new Set([participant.usn.toUpperCase()]);
      const emailSet = new Set([participant.email.toLowerCase()]);

      teamMembers.forEach((m, idx) => {
        if (!m.fullName.trim()) newErrors[`member_${idx}_name`] = 'Member name is required.';
        if (!m.email.trim() || !m.email.includes('@'))
          newErrors[`member_${idx}_email`] = 'Valid member email is required.';
        if (!m.phone.trim()) newErrors[`member_${idx}_phone`] = 'Member phone is required.';
        if (!m.usn.trim()) newErrors[`member_${idx}_usn`] = 'Member USN is required.';

        const mUsn = m.usn.toUpperCase();
        const mEmail = m.email.toLowerCase();

        if (usnSet.has(mUsn)) {
          newErrors[`member_${idx}_usn`] = 'Duplicate USN entered (already used).';
        } else if (mUsn) {
          usnSet.add(mUsn);
        }

        if (emailSet.has(mEmail)) {
          newErrors[`member_${idx}_email`] = 'Duplicate email entered (already used).';
        } else if (mEmail) {
          emailSet.add(mEmail);
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  const handleBack = () => {
    setErrors({});
    setServerError(null);
    if (currentStep === 4) {
      setCurrentStep(hasTeamEvent ? 3 : 2);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Final Registration
  const handleSubmitRegistration = async () => {
    setErrors({});
    setServerError(null);

    const newErrors: Record<string, string> = {};
    if (!transactionId.trim() || transactionId.trim().length < 6) {
      newErrors.transactionId = 'Transaction ID / UTR is required (min 6 characters).';
    }
    if (!screenshotData) {
      newErrors.screenshot = 'Payment screenshot proof is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        selectedEventIds,
        primaryParticipant: participant,
        teamName: hasTeamEvent ? teamName : undefined,
        teamMembers: hasTeamEvent ? teamMembers : undefined,
        transactionId: transactionId.trim(),
        screenshotData,
      };

      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit registration.');
      }

      // Success -> Redirect to confirmation pass
      router.push(`/register/confirmation/${data.registrationId}`);
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred. Please retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-10 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              Registration Portal
            </span>
            <h1 className="font-mokoto text-2xl sm:text-3xl tracking-wider text-slate-900 uppercase mt-3">
              HACKTOBER <span className="text-teal-600">2026</span> REGISTRATION
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Guru Nanak Dev Engineering College, Bidar • Cyber Samurai Association
            </p>
          </div>

          {/* Stepper Wizard Bar */}
          <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between relative">
              {[
                { step: 1, title: 'Events & Pricing' },
                { step: 2, title: 'Participant Info' },
                ...(hasTeamEvent ? [{ step: 3, title: 'Team Members' }] : []),
                { step: 4, title: 'Payment Proof' },
              ].map((item, idx, arr) => {
                const isActive = currentStep === item.step;
                const isDone = currentStep > item.step;
                return (
                  <div key={item.step} className="flex-1 flex flex-col items-center relative">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${
                        isDone
                          ? 'bg-teal-600 text-white shadow-xs'
                          : isActive
                          ? 'bg-slate-900 text-white ring-4 ring-slate-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-2 text-center hidden sm:block ${
                        isActive ? 'text-slate-900 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
            {/* Global Server Error Banner */}
            {serverError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-900 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p>{serverError}</p>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 1: EVENT SELECTION & DYNAMIC PRICING */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 1: Select Your Events</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select 1 or more events. The system calculates the fee dynamically according to official tiers.
                  </p>
                </div>

                {errors.events && (
                  <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.events}</span>
                  </p>
                )}

                <div className="space-y-3">
                  {OFFICIAL_EVENTS.map((event) => {
                    const isSelected = selectedEventIds.includes(event.id);
                    const isTeam = event.type === 'TEAM';
                    return (
                      <div
                        key={event.id}
                        onClick={() => toggleEvent(event.id)}
                        className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/40 ring-2 ring-teal-600/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5 cursor-pointer"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900">{event.name}</h3>
                              {isTeam ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                  Team (Max 4)
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  Individual
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                              {event.shortDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Price Summary Box */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Selected Events: {selectedEventIds.length} of 5
                    </span>
                    <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                      <span className="text-sm font-medium text-slate-600">Calculated Fee:</span>
                      <span className="text-3xl font-black text-slate-900 font-mono">
                        {pricing.displayAmount}
                      </span>
                    </div>
                  </div>

                  {/* Tier guidance message */}
                  <div className="text-xs text-right max-w-xs text-slate-500">
                    {pricing.notice && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs text-left">
                        {pricing.notice}
                      </div>
                    )}
                    {!pricing.notice && selectedEventIds.length > 0 && (
                      <span className="text-teal-700 font-semibold">
                        ✓ Tier confirmed (1=₹79, 2=₹150, 3=₹199, 4=₹300, 5=₹350)
                      </span>
                    )}
                  </div>
                </div>

                {errors.pricing && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.pricing}</span>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: PARTICIPANT INFORMATION */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Step 2: Participant Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {hasTeamEvent
                      ? 'Enter details of the Primary Registrant / Team Leader.'
                      : 'Enter your personal and academic contact details.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={participant.fullName}
                      onChange={(e) => setParticipant({ ...participant, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {errors.fullName && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={participant.email}
                      onChange={(e) => setParticipant({ ...participant, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {errors.email && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Phone Number (WhatsApp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={participant.phone}
                      onChange={(e) => setParticipant({ ...participant, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.phone}</p>
                    )}
                  </div>

                  {/* USN / Student ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      USN / Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3GN23CS042"
                      value={participant.usn}
                      onChange={(e) =>
                        setParticipant({ ...participant, usn: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase"
                    />
                    {errors.usn && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.usn}</p>
                    )}
                  </div>

                  {/* College */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      College / Institution <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Guru Nanak Dev Engineering College, Bidar"
                      value={participant.college}
                      onChange={(e) => setParticipant({ ...participant, college: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {errors.college && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.college}</p>
                    )}
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Department / Branch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSE / IoT / Cyber / AI"
                      value={participant.department}
                      onChange={(e) =>
                        setParticipant({ ...participant, department: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {errors.department && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.department}</p>
                    )}
                  </div>

                  {/* Year / Semester */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Year / Semester <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3rd Year / 5th Sem"
                      value={participant.yearSemester}
                      onChange={(e) =>
                        setParticipant({ ...participant, yearSemester: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  {/* GitHub Profile (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">
                      GitHub Profile (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={participant.githubProfile}
                      onChange={(e) =>
                        setParticipant({ ...participant, githubProfile: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  {/* LinkedIn Profile (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">
                      LinkedIn Profile (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={participant.linkedinProfile}
                      onChange={(e) =>
                        setParticipant({ ...participant, linkedinProfile: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: TEAM REGISTRATION (If Hackathon or Cyber Hunt) */}
            {/* ======================================================== */}
            {currentStep === 3 && hasTeamEvent && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 3: Team Configuration</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    You selected team competitions. Team size rule:{' '}
                    <strong className="text-slate-900 font-bold">
                      Maximum 4 members per team
                    </strong>{' '}
                    (1 Leader + up to 3 members).
                  </p>
                </div>

                {/* Team Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CyberKnights"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  {errors.teamName && (
                    <p className="text-[11px] text-red-600 font-medium">{errors.teamName}</p>
                  )}
                </div>

                {/* Leader Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Team Leader: {participant.fullName}
                    </span>
                    <span className="text-slate-500 font-mono">USN: {participant.usn}</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-teal-100 text-teal-800 font-bold text-[11px]">
                    Leader (Member 1)
                  </span>
                </div>

                {/* Additional Members */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Additional Members ({teamMembers.length} / 3 max)
                    </span>
                    {teamMembers.length < 3 && (
                      <button
                        type="button"
                        onClick={addTeamMember}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    )}
                  </div>

                  {teamMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4 relative"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-900">
                          Member {idx + 2} Details
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTeamMember(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Member Name"
                            value={member.fullName}
                            onChange={(e) => updateTeamMember(idx, 'fullName', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900"
                          />
                          {errors[`member_${idx}_name`] && (
                            <p className="text-[10px] text-red-600 mt-0.5">
                              {errors[`member_${idx}_name`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            placeholder="Member Email"
                            value={member.email}
                            onChange={(e) => updateTeamMember(idx, 'email', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900"
                          />
                          {errors[`member_${idx}_email`] && (
                            <p className="text-[10px] text-red-600 mt-0.5">
                              {errors[`member_${idx}_email`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            placeholder="Member Phone"
                            value={member.phone}
                            onChange={(e) => updateTeamMember(idx, 'phone', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900"
                          />
                          {errors[`member_${idx}_phone`] && (
                            <p className="text-[10px] text-red-600 mt-0.5">
                              {errors[`member_${idx}_phone`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            USN *
                          </label>
                          <input
                            type="text"
                            placeholder="Member USN"
                            value={member.usn}
                            onChange={(e) =>
                              updateTeamMember(idx, 'usn', e.target.value.toUpperCase())
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono uppercase focus:ring-1 focus:ring-slate-900"
                          />
                          {errors[`member_${idx}_usn`] && (
                            <p className="text-[10px] text-red-600 mt-0.5">
                              {errors[`member_${idx}_usn`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: PAYMENT PROOF & FINAL CONFIRMATION */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Step 4: Payment Verification & Review
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete your UPI transfer and submit the transaction receipt for organizer verification.
                  </p>
                </div>

                {/* Registration Review Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">
                      Registration Summary
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                      Payment Status: PENDING
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Candidate / Leader:</span>
                      <strong className="text-slate-900 text-sm">{participant.fullName}</strong>
                      <span className="text-slate-600 block">USN: {participant.usn}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Total Payable:</span>
                      <strong className="text-2xl font-black text-slate-900 font-mono">
                        {pricing.displayAmount}
                      </strong>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block mb-1">Selected Events:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEventIds.map((id) => {
                          const ev = OFFICIAL_EVENTS.find((e) => e.id === id);
                          return (
                            <span
                              key={id}
                              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-medium"
                            >
                              {ev?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {hasTeamEvent && teamName && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                        <span className="text-slate-500 block">Team:</span>
                        <strong className="text-slate-900">{teamName}</strong>
                        <span className="text-slate-600 text-xs ml-2">
                          ({teamMembers.length + 1} total members)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Official UPI Payment Box */}
                <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold">
                      <QrCode className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Official Payment Gateway</h3>
                      <p className="text-xs text-slate-500">
                        Transfer ₹{pricing.amount} via Google Pay, PhonePe, Paytm, or BHIM UPI
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* QR Code Placeholder Box */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                      <div className="w-44 h-44 mx-auto bg-white rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-3 text-slate-400">
                        <QrCode className="w-16 h-16 text-slate-300 mb-2" />
                        <span className="text-[11px] font-bold text-slate-500">PAYMENT QR CODE</span>
                        <span className="text-[10px] text-slate-400 font-mono">[TBD]</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Scan QR with any UPI app to pay
                      </span>
                    </div>

                    {/* UPI Credentials */}
                    <div className="space-y-4 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] uppercase font-bold">
                          Official UPI ID:
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-900">
                          {EVENT_INFO.paymentUpiId}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] uppercase font-bold">
                          Online Payment Link:
                        </span>
                        <span className="text-xs font-mono text-slate-700 break-all">
                          {EVENT_INFO.paymentLink}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        After transferring exactly <strong className="text-slate-800">₹{pricing.amount}</strong>, copy the 12-digit UTR/Transaction number and upload your receipt screenshot below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transaction Proof Upload Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Transaction ID / UTR */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Transaction ID / UTR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 427189034561"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {errors.transactionId && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.transactionId}</p>
                    )}
                  </div>

                  {/* Screenshot Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Payment Screenshot Proof <span className="text-red-500">*</span>
                    </label>
                    <label className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition-colors truncate">
                      <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {screenshotName || 'Choose file (PNG, JPG, WEBP, max 5MB)'}
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {errors.screenshot && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.screenshot}</p>
                    )}
                  </div>
                </div>

                {/* Privacy & Policy Notice */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-0.5">Privacy Notice:</span>
                  Information collected is strictly used for Hacktober 2026 event management, identity verification, and prize distribution by Guru Nanak Dev Engineering College, Bidar. Payment receipts are kept confidential.
                </div>
              </div>
            )}

            {/* Bottom Stepper Action Buttons */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-7 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-teal-700 transition-all shadow-sm active:scale-95"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitRegistration}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Submit Registration</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="font-medium text-sm">Loading registration portal...</span>
          </div>
        </div>
      }
    >
      <RegisterWizard />
    </Suspense>
  );
}
