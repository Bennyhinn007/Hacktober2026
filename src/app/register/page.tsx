'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import Image from 'next/image';
import {
  OFFICIAL_EVENTS,
  calculateRegistrationPrice,
  EVENT_INFO,
  EventDefinition,
  PAYMENT_ORGANIZERS,
  PaymentOrganizer,
  INITIAL_PRICING_CONFIG,
  PricingTierConfig,
} from '@/lib/constants';
import {
  Shield,
  CheckCircle2,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  QrCode,
  Upload,
  Loader2,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Download,
  Smartphone,
  Eye,
  Info,
  Phone,
  X,
  Sparkles,
} from 'lucide-react';

function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEvent = searchParams.get('event');

  // Step state: 1 = Event Selection, 2 = Participant Details, 3 = Payment & Summary
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
    department: '',
    yearSemester: '5th Sem',
  });

  const [transactionId, setTransactionId] = useState('');
  const [screenshotData, setScreenshotData] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [selectedOrganizerIndex, setSelectedOrganizerIndex] = useState(0);
  const [paidToOrganizer, setPaidToOrganizer] = useState(PAYMENT_ORGANIZERS[0].name);
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);
  const [viewAllQrs, setViewAllQrs] = useState(false);
  const [modalQr, setModalQr] = useState<PaymentOrganizer | null>(null);

  const handleCopyUpi = (upiId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(upiId);
      setTimeout(() => setCopiedUpi(null), 2500);
    }
  };

  // UI status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Dynamic Pricing Config synced with admin database
  const [pricingConfig, setPricingConfig] = useState<Record<number, PricingTierConfig>>(INITIAL_PRICING_CONFIG);

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data?.pricing) {
          setPricingConfig(json.data.pricing);
        }
      } catch (err) {
        // Fallback to INITIAL_PRICING_CONFIG
      }
    }
    loadPricing();
  }, []);

  const pricing = calculateRegistrationPrice(selectedEventIds, pricingConfig);

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

      setCurrentStep(3); // Advance directly to Payment Proof
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  const handleBack = () => {
    setErrors({});
    setServerError(null);
    if (currentStep === 3) {
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
        transactionId: transactionId.trim(),
        paidTo: paidToOrganizer || PAYMENT_ORGANIZERS[selectedOrganizerIndex].name,
        screenshotData,
        screenshotName: screenshotName || undefined,
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
                { step: 2, title: 'Participant Details' },
                { step: 3, title: 'Payment Proof' },
              ].map((item) => {
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
                                  Team Event (Offline Groups)
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

                {/* Offline Team Formation Notice Banner */}
                <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-950 text-xs flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Individual Registration:</strong> Every participant registers individually. If you choose team competitions (<em>Mini Hackathon</em> or <em>Cyber Hunt</em>), team groupings (up to 4 members) are coordinated offline directly at the event venue.
                  </p>
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
                    Enter your personal and academic contact details for your participant accreditation pass.
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
                      placeholder="e.g. CSE / EEE / Cyber / AI"
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

                  {/* Semester */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={participant.yearSemester}
                      onChange={(e) =>
                        setParticipant({ ...participant, yearSemester: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      <option value="1st Sem">1st Sem</option>
                      <option value="3rd Sem">3rd Sem</option>
                      <option value="5th Sem">5th Sem</option>
                      <option value="7th Sem">7th Sem</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: PAYMENT PROOF & FINAL CONFIRMATION */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Step 3: Payment Verification & Review
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
                      <span className="text-slate-500 block">Candidate Name:</span>
                      <strong className="text-slate-900 text-sm">{participant.fullName}</strong>
                      <span className="text-slate-600 block">USN: {participant.usn}</span>
                      <span className="text-slate-500 block text-[11px] mt-0.5">
                        {participant.department} • {participant.college}
                      </span>
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
                  </div>
                </div>

                {/* Official UPI Payment Box */}
                <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold shadow-xs">
                        <QrCode className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">Official UPI Payment Gateway</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            3 Active Coordinators
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Transfer <strong className="text-slate-900 font-semibold font-mono">₹{pricing.amount}</strong> to any of the 3 authorized coordinators below
                        </p>
                      </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setViewAllQrs(false)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          !viewAllQrs
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Single View
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewAllQrs(true)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          viewAllQrs
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        View All 3 QRs
                      </button>
                    </div>
                  </div>

                  {/* Coordinator Tabs (Visible in Single View) */}
                  {!viewAllQrs && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {PAYMENT_ORGANIZERS.map((organizer, idx) => {
                          const isSelected = selectedOrganizerIndex === idx;
                          return (
                            <button
                              key={organizer.id}
                              type="button"
                              onClick={() => {
                                setSelectedOrganizerIndex(idx);
                                setPaidToOrganizer(organizer.name);
                              }}
                              className={`p-3 rounded-xl border text-left transition-all relative ${
                                isSelected
                                  ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20 shadow-xs'
                                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[11px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                                  Coordinator {idx + 1}
                                </span>
                                {isSelected && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-teal-700">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Selected</span>
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm truncate">{organizer.name}</h4>
                              <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                                {organizer.upiId}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Coordinator Detailed Payment Card */}
                      {(() => {
                        const active = PAYMENT_ORGANIZERS[selectedOrganizerIndex];
                        return (
                          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                              {/* QR Code Presentation */}
                              <div className="md:col-span-5 flex flex-col items-center text-center">
                                <div className="relative group bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-sm transition-all hover:shadow-md">
                                  <div className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-xl overflow-hidden bg-white">
                                    <Image
                                      src={active.qrImage}
                                      alt={`${active.name} Official UPI QR Code`}
                                      fill
                                      sizes="(max-width: 640px) 208px, 224px"
                                      className="object-contain"
                                      priority
                                    />
                                  </div>

                                  {/* Hover Zoom Overlay */}
                                  <button
                                    type="button"
                                    onClick={() => setModalQr(active)}
                                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs rounded-xl"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>Click to Enlarge</span>
                                  </button>
                                </div>

                                <span className="text-[11px] font-bold text-slate-600 mt-2.5 flex items-center gap-1">
                                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Scan using PhonePe or any UPI app</span>
                                </span>

                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setModalQr(active)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs"
                                  >
                                    <Eye className="w-3 h-3 text-slate-400" />
                                    <span>Zoom QR</span>
                                  </button>
                                  <a
                                    href={active.qrImage}
                                    download={`hacktober-qr-${active.id}.jpg`}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs"
                                  >
                                    <Download className="w-3 h-3 text-slate-400" />
                                    <span>Save Image</span>
                                  </a>
                                </div>
                              </div>

                              {/* Credentials & Direct Actions */}
                              <div className="md:col-span-7 space-y-3.5 text-xs">
                                {/* Amount Banner */}
                                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                                  <div>
                                    <span className="text-[11px] text-slate-500 font-semibold block">Payable Amount:</span>
                                    <strong className="text-xl font-black text-slate-900 font-mono">
                                      ₹{pricing.amount}
                                    </strong>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                                    Exact Transfer
                                  </span>
                                </div>

                                {/* Coordinator Name & UPI ID with Copy Button */}
                                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] uppercase font-bold text-slate-500">
                                      Authorized Payee:
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-800">
                                      {active.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="truncate">
                                      <span className="text-[10px] text-slate-400 block font-semibold">UPI ID:</span>
                                      <span className="font-mono text-sm font-black text-slate-900 select-all">
                                        {active.upiId}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleCopyUpi(active.upiId)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shrink-0 ${
                                        copiedUpi === active.upiId
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-900 text-white hover:bg-teal-700 active:scale-95'
                                      }`}
                                    >
                                      {copiedUpi === active.upiId ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copy UPI ID</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                    <span>Phone / Helpline:</span>
                                    <a
                                      href={`tel:+91${active.phone}`}
                                      className="font-mono font-bold text-teal-700 hover:underline flex items-center gap-1"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>+91 {active.phone}</span>
                                    </a>
                                  </div>
                                </div>

                                {/* Direct Mobile UPI App Link */}
                                <a
                                  href={`upi://pay?pa=${active.upiId}&pn=${encodeURIComponent(
                                    active.name
                                  )}&am=${pricing.amount}&cu=INR&tn=Hacktober%202026%20Registration`}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold text-xs hover:from-teal-700 hover:to-teal-800 transition-all shadow-xs active:scale-[0.99]"
                                >
                                  <Smartphone className="w-4 h-4" />
                                  <span>Pay via UPI App (PhonePe / GPay)</span>
                                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                                </a>

                                <p className="text-[11px] text-slate-500 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                                  💡 <strong>Tip:</strong> You can pay using <strong>any UPI app</strong> (PhonePe, Google Pay, Paytm, BHIM, Cred) to any of our 3 coordinators. After paying, paste the 12-digit UTR/Transaction ID below.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* All 3 QRs Grid View */}
                  {viewAllQrs && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                        <span>You can scan and pay any of the 3 authorized coordinators below:</span>
                        <strong className="font-mono font-bold text-teal-950">₹{pricing.amount}</strong>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PAYMENT_ORGANIZERS.map((organizer, idx) => {
                          const isSelected = paidToOrganizer === organizer.name;
                          return (
                            <div
                              key={organizer.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center ${
                                isSelected
                                  ? 'border-teal-600 bg-teal-50/30 ring-2 ring-teal-600/20 shadow-xs'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="w-full flex items-center justify-between mb-2 text-xs">
                                <span className="font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                                  Option {idx + 1}
                                </span>
                                {isSelected ? (
                                  <span className="text-[10px] font-bold text-teal-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Selected</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedOrganizerIndex(idx);
                                      setPaidToOrganizer(organizer.name);
                                    }}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 underline"
                                  >
                                    Select
                                  </button>
                                )}
                              </div>

                              <div className="relative w-44 h-44 rounded-xl overflow-hidden border border-slate-200 bg-white p-1 mb-3">
                                <Image
                                  src={organizer.qrImage}
                                  alt={`${organizer.name} QR Code`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 176px"
                                  className="object-contain"
                                />
                              </div>

                              <h4 className="font-bold text-slate-900 text-sm">{organizer.name}</h4>
                              <p className="font-mono text-xs font-semibold text-slate-700 mt-0.5 break-all">
                                {organizer.upiId}
                              </p>

                              <div className="w-full flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handleCopyUpi(organizer.upiId)}
                                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                                    copiedUpi === organizer.upiId
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                  }`}
                                >
                                  {copiedUpi === organizer.upiId ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-500" />
                                      <span>Copy UPI</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setModalQr(organizer)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                                  title="Enlarge QR"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Transaction Proof Upload Fields */}
                <div className="space-y-4">
                  {/* Coordinator Paid To Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Coordinator Transferred To <span className="text-red-500">*</span></span>
                      <span className="text-[11px] text-slate-400 font-normal">Choose which QR you paid</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {PAYMENT_ORGANIZERS.map((organizer, idx) => (
                        <label
                          key={organizer.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            paidToOrganizer === organizer.name
                              ? 'border-teal-600 bg-teal-50/60 font-bold text-slate-900 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paidTo"
                            value={organizer.name}
                            checked={paidToOrganizer === organizer.name}
                            onChange={() => {
                              setPaidToOrganizer(organizer.name);
                              setSelectedOrganizerIndex(idx);
                            }}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span className="truncate">{organizer.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Transaction ID / UTR */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Transaction ID / UTR Number <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-slate-400">12-digit UPI reference</span>
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
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Payment Screenshot Proof <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-slate-400">PNG, JPG, WEBP (max 5MB)</span>
                      </label>
                      <label className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition-colors truncate">
                        <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {screenshotName || 'Choose screenshot file'}
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

                      {/* Screenshot thumbnail preview */}
                      {screenshotData && (
                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                          <img
                            src={screenshotData}
                            alt="Receipt Preview"
                            className="w-10 h-10 object-cover rounded-md border border-slate-300"
                          />
                          <div className="truncate flex-1">
                            <span className="font-semibold text-slate-800 block truncate">{screenshotName}</span>
                            <span className="text-[10px] text-emerald-600 font-bold">Screenshot attached</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Modal for Zoom */}
                {modalQr && (
                  <div
                    className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setModalQr(null)}
                  >
                    <div
                      className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 text-center shadow-2xl relative animate-in fade-in zoom-in-95"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setModalQr(null)}
                        className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                        <span>Official UPI Payment QR</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">{modalQr.name}</h3>

                      <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-inner">
                        <Image
                          src={modalQr.qrImage}
                          alt={`${modalQr.name} Full QR`}
                          fill
                          sizes="(max-width: 640px) 256px, 256px"
                          className="object-contain"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">UPI ID</span>
                        <span className="font-mono text-base font-bold text-slate-900 select-all block">
                          {modalQr.upiId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyUpi(modalQr.upiId)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {copiedUpi === modalQr.upiId ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy UPI ID</span>
                            </>
                          )}
                        </button>
                        <a
                          href={modalQr.qrImage}
                          download={`hacktober-qr-${modalQr.id}.jpg`}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-4 h-4" />
                          <span>Save</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

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

              {currentStep < 3 ? (
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
