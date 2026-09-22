// Database TypeScript Interfaces

export interface IParticipant {
  id: string;
  registrationId: string;
  isPrimary: boolean;
  fullName: string;
  email: string;
  phone: string;
  usn: string;
  college: string;
  department: string;
  yearSemester: string;
  githubProfile?: string;
  linkedinProfile?: string;
  createdAt: string;
}

export interface ITeam {
  id: string;
  registrationId: string;
  eventId: string;
  teamName: string;
  leaderParticipantId: string;
  memberParticipantIds: string[]; // up to 3 additional members (max 4 total)
  createdAt: string;
}

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AttendanceStatus = 'NOT_MARKED' | 'PRESENT' | 'ABSENT';

export interface IPayment {
  id: string;
  registrationId: string;
  amount: number;
  transactionId: string; // UTR
  screenshotUrl: string; // base64 or stored URL
  screenshotMime: string;
  status: PaymentStatus;
  adminNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface IAttendance {
  id: string;
  registrationId: string;
  participantId: string;
  eventId: string;
  status: AttendanceStatus;
  markedAt: string;
  markedBy: string; // Admin user who marked
}

export interface IRegistration {
  id: string;
  registrationId: string; // HT26-XXXXXX
  eventIds: string[];
  type: 'INDIVIDUAL' | 'TEAM' | 'MIXED';
  totalAmount: number;
  paymentStatus: PaymentStatus;
  attendanceStatus: 'NOT_MARKED' | 'PARTIAL' | 'COMPLETED';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';

export interface IAdmin {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface IAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface ISetting {
  key: string;
  value: unknown;
  updatedAt: string;
}
