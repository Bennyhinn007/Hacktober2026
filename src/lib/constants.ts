// Centralized Constants & Configurations for Hacktober 2026
// Guru Nanak Dev Engineering College, Bidar

export interface EventDefinition {
  id: string;
  name: string;
  slug: string;
  type: 'INDIVIDUAL' | 'TEAM';
  maxTeamSize: number;
  minTeamSize: number;
  shortDescription: string;
  description: string;
  rules: string[];
  eligibility: string;
  coordinator: string; // [TBD]
  time: string; // [TBD]
  venue: string; // [TBD]
  icon: string;
}

export const OFFICIAL_EVENTS: EventDefinition[] = [
  {
    id: 'cyber-quiz',
    name: 'Cybersecurity Quiz',
    slug: 'cybersecurity-quiz',
    type: 'INDIVIDUAL',
    minTeamSize: 1,
    maxTeamSize: 1,
    shortDescription: 'High-octane technical quiz testing fundamentals of networking, cryptography, forensics, and modern cybersecurity.',
    description: 'A multi-round intellectual battle evaluating knowledge in ethical hacking, network protocols, defensive ops, and real-world vulnerability landscapes.',
    rules: [
      'Individual participation only (1 participant per registration).',
      'Preliminary round consists of objective cybersecurity and network protocol questions.',
      'Negative marking applies in final buzzer rounds.',
      'Use of mobile devices or unauthorized internet access during the round is strictly prohibited.',
    ],
    eligibility: 'All undergraduate and postgraduate engineering/technology students with valid college ID.',
    coordinator: '[TBD]',
    time: 'TBD',
    venue: 'TBD',
    icon: 'BrainCircuit',
  },
  {
    id: 'cyber-debate',
    name: 'Cybersecurity Debate',
    slug: 'cybersecurity-debate',
    type: 'INDIVIDUAL',
    minTeamSize: 1,
    maxTeamSize: 1,
    shortDescription: 'Debate on critical cyber ethics, AI governance, surveillance vs privacy, and national cyber sovereignty.',
    description: 'Articulate logical, evidence-grounded arguments on contemporary technological controversies, digital surveillance, offensive cyber actions, and ethical responsibility.',
    rules: [
      'Individual participation only.',
      'Topics will be assigned through a transparent draw prior to each round.',
      'Constructive speech: 3 minutes; Rebuttal: 2 minutes; Closing: 1 minute.',
      'Unparliamentary language or personal attacks results in immediate disqualification.',
    ],
    eligibility: 'Open to all enrolled students with valid institutional identification.',
    coordinator: '[TBD]',
    time: 'TBD',
    venue: 'TBD',
    icon: 'MessageSquareText',
  },
  {
    id: 'mini-hackathon',
    name: 'Mini Hackathon',
    slug: 'mini-hackathon',
    type: 'TEAM',
    minTeamSize: 2,
    maxTeamSize: 4,
    shortDescription: 'Fast-paced collaborative sprint to design, build, and deploy secure tech prototypes addressing real-world problem statements.',
    description: 'Teams of up to 4 members collaborate to engineer functional prototypes in cloud security, IoT protection, blockchain integrity, or cyber threat intelligence.',
    rules: [
      'Individual online registration. Teams (up to 4 members) are formed offline directly at the event venue.',
      'All code must be authored during the event timeframe. Pre-built proprietary solutions are disallowed.',
      'Open-source libraries and APIs are permitted provided proper attribution is documented.',
      'Final submission must include a live demo and public GitHub repository.',
    ],
    eligibility: 'Inter-college and intra-department teams permitted. Valid ID required for every member.',
    coordinator: '[TBD]',
    time: 'TBD',
    venue: 'TBD',
    icon: 'Terminal',
  },
  {
    id: 'cyber-hunt',
    name: 'Cyber Hunt',
    slug: 'cyber-hunt',
    type: 'TEAM',
    minTeamSize: 2,
    maxTeamSize: 4,
    shortDescription: 'Challenging capture-the-flag (CTF) and campus cryptographic scavenger hunt solving steganography and logic puzzles.',
    description: 'Navigate through cryptograms, web exploitation challenges, forensics puzzles, and physical campus clues to decrypt the master flag.',
    rules: [
      'Individual online registration. Teams (up to 4 members) are formed offline directly at the event venue.',
      'Participants may interact ONLY with systems explicitly authorized in writing by the organizers.',
      'Attacking event infrastructure or scoring servers results in immediate disqualification and security review.',
      'Flag sharing between distinct teams is strictly prohibited.',
    ],
    eligibility: 'Teams of up to 4 registered students formed offline at venue.',
    coordinator: '[TBD]',
    time: 'TBD',
    venue: 'TBD',
    icon: 'ShieldAlert',
  },
  {
    id: 'tech-debug',
    name: 'Technical Debugging',
    slug: 'technical-debugging',
    type: 'INDIVIDUAL',
    minTeamSize: 1,
    maxTeamSize: 1,
    shortDescription: 'Time-critical debugging contest finding and remediating vulnerabilities, race conditions, and logic bugs in complex codebases.',
    description: 'Analyze buggy source code across C++, Python, and JavaScript. Diagnose memory leaks, fix buffer overflows, solve concurrency deadlocks, and pass automated unit tests.',
    rules: [
      'Individual participation only.',
      'Solutions are evaluated on test coverage, execution efficiency, and time taken.',
      'Participants must use the supplied standardized sandbox environment.',
      'Plagiarism checks will be automatically executed against all submitted patches.',
    ],
    eligibility: 'Individual students with basic to advanced programming proficiency.',
    coordinator: '[TBD]',
    time: 'TBD',
    venue: 'TBD',
    icon: 'Bug',
  },
];

// Centralized Pricing Configuration
export interface PricingTierConfig {
  eventCount: number;
  price: number | null; // null represents unfinalized TBD
  status: 'ACTIVE' | 'TBD';
  notice?: string;
}

export const INITIAL_PRICING_CONFIG: Record<number, PricingTierConfig> = {
  1: { eventCount: 1, price: 79, status: 'ACTIVE' },
  2: { eventCount: 2, price: 150, status: 'ACTIVE' },
  3: { eventCount: 3, price: 199, status: 'ACTIVE' },
  4: { eventCount: 4, price: 300, status: 'ACTIVE' },
  5: { eventCount: 5, price: 350, status: 'ACTIVE' },
};

export interface PricingCalculationResult {
  count: number;
  isConfigured: boolean;
  amount: number | null;
  displayAmount: string;
  notice: string | null;
  canProceed: boolean;
}

export function calculateRegistrationPrice(
  selectedEventIds: string[],
  customConfig?: Record<number, PricingTierConfig>
): PricingCalculationResult {
  const count = selectedEventIds.length;
  if (count === 0) {
    return {
      count: 0,
      isConfigured: true,
      amount: 0,
      displayAmount: '₹0',
      notice: 'Please select at least 1 event.',
      canProceed: false,
    };
  }

  const config = customConfig || INITIAL_PRICING_CONFIG;
  const tier = config[count];

  if (!tier || tier.status === 'TBD' || tier.price === null) {
    return {
      count,
      isConfigured: false,
      amount: null,
      displayAmount: 'TBD',
      notice: tier?.notice || 'Pricing for this combination will be confirmed by the organizers.',
      canProceed: false,
    };
  }

  return {
    count,
    isConfigured: true,
    amount: tier.price,
    displayAmount: `₹${tier.price}`,
    notice: null,
    canProceed: true,
  };
}

export const EVENT_INFO = {
  name: 'Hacktober 2026',
  tagline: 'Think. Hack. Defend. Debug.',
  dates: '3 October 2026 to 5 October 2026',
  datesShort: '3–5 October 2026',
  startDate: '2026-10-03T09:00:00+05:30',
  endDate: '2026-10-05T18:00:00+05:30',
  institution: 'Guru Nanak Dev Engineering College, Bidar',
  department: 'Department of CSE, IoT and Cybersecurity including Blockchain Technology',
  prizeNotice: 'Prizes will be announced as a surprise.',
  venue: '[TBD]',
  contactEmail: '[TBD]',
  contactPhone: '[TBD]',
  paymentUpiId: '[TBD]',
  paymentLink: '[TBD]',
  paymentQrImage: '/images/payment-qr-tbd.png',
};

export const INITIAL_SCHEDULE = [
  {
    day: 'Day 1',
    date: '3 October 2026',
    items: [
      { event: 'Inauguration & Keynote Address', time: 'TBD', venue: 'TBD', type: 'GENERAL' },
      { event: 'Cybersecurity Quiz (Prelims & Finals)', time: 'TBD', venue: 'TBD', type: 'EVENT' },
      { event: 'Mini Hackathon (Problem Briefing & Kickoff)', time: 'TBD', venue: 'TBD', type: 'EVENT' },
    ],
  },
  {
    day: 'Day 2',
    date: '4 October 2026',
    items: [
      { event: 'Mini Hackathon (Mentorship & Sprint Review)', time: 'TBD', venue: 'TBD', type: 'EVENT' },
      { event: 'Cybersecurity Debate (Preliminary & Quarter-Finals)', time: 'TBD', venue: 'TBD', type: 'EVENT' },
      { event: 'Cyber Hunt (Phase 1 — Crypto & Forensics CTF)', time: 'TBD', venue: 'TBD', type: 'EVENT' },
    ],
  },
  {
    day: 'Day 3',
    date: '5 October 2026',
    items: [
      { event: 'Technical Debugging (Live Coding Gauntlet)', time: 'TBD', venue: 'TBD', type: 'EVENT' },
      { event: 'Mini Hackathon (Final Project Presentations)', time: 'TBD', venue: 'TBD', type: 'EVENT' },
      { event: 'Cybersecurity Debate (Grand Finals)', time: 'TBD', venue: 'TBD', type: 'EVENT' },
      { event: 'Valedictory & Prize Distribution (Surprise Announcements)', time: 'TBD', venue: 'TBD', type: 'GENERAL' },
    ],
  },
];

export const GENERAL_RULES = [
  'Participants must provide accurate registration information.',
  'Participants must carry valid college/student identification.',
  'Each participant must register using a valid email address and phone number.',
  'Team events allow a maximum of 4 members.',
  'Individual events cannot be transferred to another participant without organizer approval.',
  'Participants must follow event-specific rules.',
  'Any form of cheating, impersonation, plagiarism, unauthorized system access, or disruptive behavior may result in disqualification.',
  'Participants must report before the specified event start time.',
  'Organizers reserve the right to verify registration and payment information.',
  'Payment once verified should not be considered automatically refundable unless organizers explicitly configure a refund policy.',
  'Participants must follow applicable cybersecurity laws and event rules.',
  'For cybersecurity challenges, participants may interact only with systems explicitly authorized by the organizers.',
];

export const DISQUALIFICATION_DISCLAIMER =
  'Disclaimer: Final schedule, rules, and venue allocations may be updated by the organizing committee. Official announcements will be notified via registered email and the notice board.';

export const ALLOWED_SEMESTERS = ['1st Sem', '3rd Sem', '5th Sem', '7th Sem'] as const;
export type AllowedSemester = (typeof ALLOWED_SEMESTERS)[number];
