import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import type {
  IRegistration,
  IParticipant,
  ITeam,
  IPayment,
  IAttendance,
  IAdmin,
  IAuditLog,
  ISetting,
  AdminRole,
  PaymentStatus,
  AttendanceStatus,
} from './types';
import { INITIAL_PRICING_CONFIG, INITIAL_SCHEDULE, EVENT_INFO } from '../constants';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseStore {
  registrations: IRegistration[];
  participants: IParticipant[];
  teams: ITeam[];
  payments: IPayment[];
  attendance: IAttendance[];
  admins: IAdmin[];
  auditLogs: IAuditLog[];
  settings: Record<string, unknown>;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function ensureRequiredAdmins(store: DatabaseStore): void {
  if (!Array.isArray(store.admins)) {
    store.admins = [];
  }

  // 1. Super Admin: bennyhinn.icb@gmail.com / ICB@2005
  const bennyEmail = 'bennyhinn.icb@gmail.com';
  const bennyAdmin = store.admins.find((a) => a.email.toLowerCase() === bennyEmail);
  const bennySalt = bcrypt.genSaltSync(12);
  const bennyHash = bcrypt.hashSync('ICB@2005', bennySalt);

  if (!bennyAdmin) {
    store.admins.push({
      id: 'adm_benny_super',
      email: bennyEmail,
      passwordHash: bennyHash,
      fullName: 'Benny Hinn (Super Admin)',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  } else {
    bennyAdmin.passwordHash = bennyHash;
    bennyAdmin.role = 'SUPER_ADMIN';
    bennyAdmin.isActive = true;
  }

  // 2. Default test admin: admin@gndec.ac.in / Admin@Hacktober2026
  const defaultEmail = 'admin@gndec.ac.in';
  const defaultAdmin = store.admins.find((a) => a.email.toLowerCase() === defaultEmail);
  const defaultSalt = bcrypt.genSaltSync(12);
  const defaultHash = bcrypt.hashSync('Admin@Hacktober2026', defaultSalt);

  if (!defaultAdmin) {
    store.admins.push({
      id: 'adm_super_01',
      email: defaultEmail,
      passwordHash: defaultHash,
      fullName: 'Lead Organizer (CSE & Cyber)',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  } else {
    defaultAdmin.passwordHash = defaultHash;
    defaultAdmin.role = 'SUPER_ADMIN';
    defaultAdmin.isActive = true;
  }
}

function initializeStore(): DatabaseStore {
  ensureDataDir();
  let store: DatabaseStore | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      store = JSON.parse(data);
    } catch {
      // fallback
    }
  }

  if (!store) {
    store = {
      registrations: [],
      participants: [],
      teams: [],
      payments: [],
      attendance: [],
      admins: [],
      auditLogs: [
        {
          id: 'log_init',
          adminId: 'system',
          adminEmail: 'system@gndec.ac.in',
          action: 'SYSTEM_INITIALIZED',
          resource: 'SYSTEM',
          resourceId: 'INIT',
          metadata: { info: 'Database initialized for Hacktober 2026' },
          timestamp: new Date().toISOString(),
        },
      ],
      settings: {
        pricing: INITIAL_PRICING_CONFIG,
        schedule: INITIAL_SCHEDULE,
        eventInfo: EVENT_INFO,
      },
    };
  }

  ensureRequiredAdmins(store);
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  return store;
}

let memoryStore: DatabaseStore | null = null;

function getStore(): DatabaseStore {
  if (!memoryStore) {
    memoryStore = initializeStore();
  }
  ensureRequiredAdmins(memoryStore);
  return memoryStore;
}

function saveStore(): void {
  ensureDataDir();
  if (memoryStore) {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  }
}

export const dbRepository = {
  // Registrations
  async createRegistration(data: {
    registration: Omit<IRegistration, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'attendanceStatus'>;
    primaryParticipant: Omit<IParticipant, 'id' | 'registrationId' | 'isPrimary' | 'createdAt'>;
    teamMembers?: Array<Omit<IParticipant, 'id' | 'registrationId' | 'isPrimary' | 'createdAt'>>;
    teamName?: string;
    teamEventId?: string;
    payment: Omit<IPayment, 'id' | 'registrationId' | 'createdAt'> & { status?: PaymentStatus };
  }): Promise<{ registration: IRegistration; payment: IPayment }> {
    const store = getStore();
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newRegistration: IRegistration = {
      ...data.registration,
      id: regId,
      attendanceStatus: 'NOT_MARKED',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    // Primary participant
    const primaryId = `part_${Date.now()}_0`;
    const primaryPart: IParticipant = {
      ...data.primaryParticipant,
      id: primaryId,
      registrationId: data.registration.registrationId,
      isPrimary: true,
      createdAt: now,
    };

    store.registrations.push(newRegistration);
    store.participants.push(primaryPart);

    // If team event
    if (data.teamName && data.teamEventId) {
      const memberIds: string[] = [];
      if (data.teamMembers && data.teamMembers.length > 0) {
        data.teamMembers.forEach((member, idx) => {
          const mId = `part_${Date.now()}_${idx + 1}`;
          memberIds.push(mId);
          store.participants.push({
            ...member,
            id: mId,
            registrationId: data.registration.registrationId,
            isPrimary: false,
            createdAt: now,
          });
        });
      }

      const newTeam: ITeam = {
        id: `team_${Date.now()}`,
        registrationId: data.registration.registrationId,
        eventId: data.teamEventId,
        teamName: data.teamName,
        leaderParticipantId: primaryId,
        memberParticipantIds: memberIds,
        createdAt: now,
      };
      store.teams.push(newTeam);
    }

    // Security safeguard: MongoDB/database must NEVER store raw base64 or image binary
    if (data.payment.screenshotUrl && data.payment.screenshotUrl.startsWith('data:')) {
      throw new Error(
        'Security policy violation: Raw image binary/base64 is prohibited in database storage. Cloudinary CDN asset required.'
      );
    }

    // Payment record
    const newPayment: IPayment = {
      ...data.payment,
      id: `pay_${Date.now()}`,
      registrationId: data.registration.registrationId,
      status: data.payment.status || data.registration.paymentStatus || 'PENDING',
      createdAt: now,
    };
    store.payments.push(newPayment);

    saveStore();
    return { registration: newRegistration, payment: newPayment };
  },

  async getRegistrationById(registrationId: string): Promise<{
    registration: IRegistration;
    participants: IParticipant[];
    team?: ITeam;
    payment?: IPayment;
    attendance: IAttendance[];
  } | null> {
    const store = getStore();
    const reg = store.registrations.find(
      (r) => r.registrationId === registrationId || r.id === registrationId
    );
    if (!reg) return null;

    const participants = store.participants.filter(
      (p) => p.registrationId === reg.registrationId
    );
    const team = store.teams.find((t) => t.registrationId === reg.registrationId);
    const payment = store.payments.find((p) => p.registrationId === reg.registrationId);
    const attendance = store.attendance.filter(
      (a) => a.registrationId === reg.registrationId
    );

    return { registration: reg, participants, team, payment, attendance };
  },

  async listRegistrations(params: {
    search?: string;
    eventId?: string;
    paymentStatus?: string;
    department?: string;
    yearSemester?: string;
    attendanceStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    includeArchived?: boolean;
  }): Promise<{
    items: Array<{
      registration: IRegistration;
      primaryParticipant: IParticipant | null;
      teamName?: string;
      paymentStatus: PaymentStatus;
      amount: number;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const store = getStore();
    let list = store.registrations.filter((r) =>
      params.includeArchived ? true : !r.isArchived
    );

    // Filter by event
    if (params.eventId && params.eventId !== 'ALL') {
      list = list.filter((r) => r.eventIds.includes(params.eventId as string));
    }

    // Filter by payment status
    if (params.paymentStatus && params.paymentStatus !== 'ALL') {
      list = list.filter((r) => r.paymentStatus === params.paymentStatus);
    }

    // Filter by attendance status
    if (params.attendanceStatus && params.attendanceStatus !== 'ALL') {
      list = list.filter((r) => r.attendanceStatus === params.attendanceStatus);
    }

    // Map items with details for search and additional filters
    let enriched = list.map((reg) => {
      const primary = store.participants.find(
        (p) => p.registrationId === reg.registrationId && p.isPrimary
      ) || store.participants.find((p) => p.registrationId === reg.registrationId) || null;
      const team = store.teams.find((t) => t.registrationId === reg.registrationId);
      const payment = store.payments.find((p) => p.registrationId === reg.registrationId);

      return {
        registration: reg,
        primaryParticipant: primary,
        teamName: team?.teamName,
        paymentStatus: payment?.status || reg.paymentStatus,
        amount: reg.totalAmount,
      };
    });

    // Filter by Department
    if (params.department && params.department !== 'ALL') {
      enriched = enriched.filter(
        (item) => item.primaryParticipant?.department === params.department
      );
    }

    // Filter by Year
    if (params.yearSemester && params.yearSemester !== 'ALL') {
      enriched = enriched.filter(
        (item) => item.primaryParticipant?.yearSemester === params.yearSemester
      );
    }

    // Search query
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      enriched = enriched.filter((item) => {
        const regIdMatch = item.registration.registrationId.toLowerCase().includes(q);
        const nameMatch = item.primaryParticipant?.fullName.toLowerCase().includes(q);
        const emailMatch = item.primaryParticipant?.email.toLowerCase().includes(q);
        const phoneMatch = item.primaryParticipant?.phone.toLowerCase().includes(q);
        const usnMatch = item.primaryParticipant?.usn.toLowerCase().includes(q);
        const teamMatch = item.teamName?.toLowerCase().includes(q);
        return (
          regIdMatch || nameMatch || emailMatch || phoneMatch || usnMatch || teamMatch
        );
      });
    }

    // Sorting
    const sortKey = params.sortBy || 'createdAt';
    const order = params.sortOrder === 'asc' ? 1 : -1;
    enriched.sort((a, b) => {
      if (sortKey === 'createdAt') {
        return (
          (new Date(a.registration.createdAt).getTime() -
            new Date(b.registration.createdAt).getTime()) *
          order
        );
      }
      if (sortKey === 'amount') {
        return (a.amount - b.amount) * order;
      }
      if (sortKey === 'name') {
        const nameA = a.primaryParticipant?.fullName || '';
        const nameB = b.primaryParticipant?.fullName || '';
        return nameA.localeCompare(nameB) * order;
      }
      return 0;
    });

    const total = enriched.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 15);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = enriched.slice((page - 1) * limit, page * limit);

    return {
      items: paginated,
      total,
      page,
      totalPages,
    };
  },

  async updatePaymentStatus(
    registrationId: string,
    status: PaymentStatus,
    adminEmail: string,
    adminNote?: string
  ): Promise<boolean> {
    const store = getStore();
    const reg = store.registrations.find((r) => r.registrationId === registrationId);
    if (!reg) return false;

    reg.paymentStatus = status;
    reg.updatedAt = new Date().toISOString();

    const payment = store.payments.find((p) => p.registrationId === registrationId);
    if (payment) {
      payment.status = status;
      payment.verifiedBy = adminEmail;
      payment.verifiedAt = new Date().toISOString();
      if (adminNote) payment.adminNote = adminNote;
    }

    // Log action
    this.addAuditLog({
      adminId: adminEmail,
      adminEmail,
      action: `PAYMENT_${status}`,
      resource: 'PAYMENT',
      resourceId: registrationId,
      metadata: { status, adminNote },
    });

    saveStore();
    return true;
  },

  async toggleArchiveRegistration(
    registrationId: string,
    adminEmail: string,
    archive = true
  ): Promise<boolean> {
    const store = getStore();
    const reg = store.registrations.find((r) => r.registrationId === registrationId);
    if (!reg) return false;

    reg.isArchived = archive;
    reg.updatedAt = new Date().toISOString();

    this.addAuditLog({
      adminId: adminEmail,
      adminEmail,
      action: archive ? 'REGISTRATION_ARCHIVED' : 'REGISTRATION_RESTORED',
      resource: 'REGISTRATION',
      resourceId: registrationId,
    });

    saveStore();
    return true;
  },

  // Attendance
  async markAttendance(data: {
    registrationId: string;
    participantId: string;
    eventId: string;
    adminEmail: string;
  }): Promise<{ success: boolean; alreadyMarked: boolean; attendance?: IAttendance }> {
    const store = getStore();
    const existing = store.attendance.find(
      (a) =>
        a.registrationId === data.registrationId &&
        a.participantId === data.participantId &&
        a.eventId === data.eventId &&
        a.status === 'PRESENT'
    );

    if (existing) {
      return { success: true, alreadyMarked: true, attendance: existing };
    }

    const now = new Date().toISOString();
    const newRecord: IAttendance = {
      id: `att_${Date.now()}`,
      registrationId: data.registrationId,
      participantId: data.participantId,
      eventId: data.eventId,
      status: 'PRESENT',
      markedAt: now,
      markedBy: data.adminEmail,
    };
    store.attendance.push(newRecord);

    // Update registration attendance status
    const reg = store.registrations.find((r) => r.registrationId === data.registrationId);
    if (reg) {
      const allEventsCount = reg.eventIds.length;
      const attendedCount = store.attendance.filter(
        (a) => a.registrationId === data.registrationId && a.status === 'PRESENT'
      ).length;
      reg.attendanceStatus = attendedCount >= allEventsCount ? 'COMPLETED' : 'PARTIAL';
      reg.updatedAt = now;
    }

    this.addAuditLog({
      adminId: data.adminEmail,
      adminEmail: data.adminEmail,
      action: 'ATTENDANCE_MARKED',
      resource: 'ATTENDANCE',
      resourceId: data.registrationId,
      metadata: { eventId: data.eventId, participantId: data.participantId },
    });

    saveStore();
    return { success: true, alreadyMarked: false, attendance: newRecord };
  },

  // Analytics & Dashboard Stats
  async getDashboardAnalytics(): Promise<{
    totalRegistrations: number;
    paidRegistrations: number;
    pendingPayments: number;
    rejectedPayments: number;
    totalParticipants: number;
    totalTeams: number;
    totalRevenue: number;
    totalAttendance: number;
    eventParticipation: Record<string, number>;
    recentRegistrations: Array<{
      registrationId: string;
      name: string;
      events: string[];
      amount: number;
      paymentStatus: PaymentStatus;
      createdAt: string;
    }>;
  }> {
    const store = getStore();
    const activeRegs = store.registrations.filter((r) => !r.isArchived);

    const paidRegs = activeRegs.filter((r) => r.paymentStatus === 'VERIFIED');
    const pendingRegs = activeRegs.filter((r) => r.paymentStatus === 'PENDING');
    const rejectedRegs = activeRegs.filter((r) => r.paymentStatus === 'REJECTED');

    const totalRevenue = paidRegs.reduce((sum, r) => sum + r.totalAmount, 0);

    const eventCounts: Record<string, number> = {
      'cyber-quiz': 0,
      'cyber-debate': 0,
      'mini-hackathon': 0,
      'cyber-hunt': 0,
      'tech-debug': 0,
    };

    activeRegs.forEach((r) => {
      r.eventIds.forEach((eId) => {
        if (eventCounts[eId] !== undefined) {
          eventCounts[eId]++;
        } else {
          eventCounts[eId] = 1;
        }
      });
    });

    const recent = activeRegs
      .slice(-6)
      .reverse()
      .map((r) => {
        const primary = store.participants.find(
          (p) => p.registrationId === r.registrationId && p.isPrimary
        );
        return {
          registrationId: r.registrationId,
          name: primary?.fullName || 'Participant',
          events: r.eventIds,
          amount: r.totalAmount,
          paymentStatus: r.paymentStatus,
          createdAt: r.createdAt,
        };
      });

    return {
      totalRegistrations: activeRegs.length,
      paidRegistrations: paidRegs.length,
      pendingPayments: pendingRegs.length,
      rejectedPayments: rejectedRegs.length,
      totalParticipants: store.participants.length,
      totalTeams: store.teams.length,
      totalRevenue,
      totalAttendance: store.attendance.filter((a) => a.status === 'PRESENT').length,
      eventParticipation: eventCounts,
      recentRegistrations: recent,
    };
  },

  // Teams
  async listTeams(): Promise<
    Array<{
      team: ITeam;
      registration: IRegistration | null;
      leader: IParticipant | null;
      members: IParticipant[];
      paymentStatus: PaymentStatus;
    }>
  > {
    const store = getStore();
    return store.teams.map((t) => {
      const reg = store.registrations.find((r) => r.registrationId === t.registrationId) || null;
      const leader = store.participants.find((p) => p.id === t.leaderParticipantId) || null;
      const members = store.participants.filter((p) =>
        t.memberParticipantIds.includes(p.id)
      );
      return {
        team: t,
        registration: reg,
        leader,
        members,
        paymentStatus: reg?.paymentStatus || 'PENDING',
      };
    });
  },

  // Admins & RBAC
  async findAdminByEmail(email: string): Promise<IAdmin | null> {
    const store = getStore();
    return (
      store.admins.find(
        (a) => a.email.toLowerCase() === email.toLowerCase() && a.isActive
      ) || null
    );
  },

  async listAdmins(): Promise<Array<Omit<IAdmin, 'passwordHash'>>> {
    const store = getStore();
    return store.admins.map(({ passwordHash: _, ...rest }) => rest);
  },

  async createAdmin(data: {
    email: string;
    password: string;
    fullName: string;
    role: AdminRole;
    creatorEmail: string;
  }): Promise<Omit<IAdmin, 'passwordHash'>> {
    const store = getStore();
    const existing = store.admins.find(
      (a) => a.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      throw new Error('An organizer account with this email already exists.');
    }

    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(data.password, salt);
    const newAdmin: IAdmin = {
      id: `adm_${Date.now()}`,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      fullName: data.fullName,
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    store.admins.push(newAdmin);

    this.addAuditLog({
      adminId: data.creatorEmail,
      adminEmail: data.creatorEmail,
      action: 'ORGANIZER_CREATED',
      resource: 'ADMIN',
      resourceId: newAdmin.id,
      metadata: { role: data.role, email: data.email },
    });

    saveStore();
    const { passwordHash: _, ...rest } = newAdmin;
    return rest;
  },

  async updateAdminRole(
    adminId: string,
    role: AdminRole,
    creatorEmail: string
  ): Promise<boolean> {
    const store = getStore();
    const admin = store.admins.find((a) => a.id === adminId);
    if (!admin) return false;

    admin.role = role;
    this.addAuditLog({
      adminId: creatorEmail,
      adminEmail: creatorEmail,
      action: 'ORGANIZER_ROLE_CHANGED',
      resource: 'ADMIN',
      resourceId: adminId,
      metadata: { newRole: role },
    });

    saveStore();
    return true;
  },

  async toggleAdminActive(
    adminId: string,
    isActive: boolean,
    creatorEmail: string
  ): Promise<boolean> {
    const store = getStore();
    const admin = store.admins.find((a) => a.id === adminId);
    if (!admin) return false;

    admin.isActive = isActive;
    this.addAuditLog({
      adminId: creatorEmail,
      adminEmail: creatorEmail,
      action: isActive ? 'ORGANIZER_ACTIVATED' : 'ORGANIZER_DEACTIVATED',
      resource: 'ADMIN',
      resourceId: adminId,
    });

    saveStore();
    return true;
  },

  // Audit Logs
  addAuditLog(data: Omit<IAuditLog, 'id' | 'timestamp'>): void {
    const store = getStore();
    const log: IAuditLog = {
      ...data,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    store.auditLogs.unshift(log);
    // Keep max 1000 logs in storage
    if (store.auditLogs.length > 1000) {
      store.auditLogs = store.auditLogs.slice(0, 1000);
    }
    saveStore();
  },

  async listAuditLogs(limit = 100): Promise<IAuditLog[]> {
    const store = getStore();
    return store.auditLogs.slice(0, limit);
  },

  // Settings
  async getSettings(): Promise<Record<string, unknown>> {
    const store = getStore();
    return store.settings;
  },

  async updateSetting(key: string, value: unknown, adminEmail: string): Promise<void> {
    const store = getStore();
    store.settings[key] = value;

    this.addAuditLog({
      adminId: adminEmail,
      adminEmail,
      action: `SETTING_UPDATED_${key.toUpperCase()}`,
      resource: 'SETTING',
      resourceId: key,
      metadata: { key },
    });

    saveStore();
  },
};
