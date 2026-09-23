/**
 * MongoDB Atlas Repository — Production persistence layer.
 *
 * Implements the exact same interface as the local file-based dbRepository in
 * repository.ts so every API route can import from the unified selector
 * (repository-selector.ts) without modification.
 *
 * Serverless-safe: uses the global mongoose connection cache defined in
 * mongodb.ts so Vercel cold-starts reuse existing connections within the
 * same function container.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';
import { INITIAL_PRICING_CONFIG, INITIAL_SCHEDULE, EVENT_INFO } from '../constants';
import type {
  IRegistration,
  IParticipant,
  ITeam,
  IPayment,
  IAttendance,
  IAdmin,
  IAuditLog,
  AdminRole,
  PaymentStatus,
} from './types';

// ---------------------------------------------------------------------------
// Mongoose Schemas
// ---------------------------------------------------------------------------

// Registration
interface IRegistrationDoc extends Document, Omit<IRegistration, 'id'> {}
const RegistrationSchema = new Schema<IRegistrationDoc>(
  {
    registrationId: { type: String, required: true, unique: true, index: true },
    eventIds: [{ type: String }],
    type: { type: String, enum: ['INDIVIDUAL', 'TEAM', 'MIXED'], default: 'INDIVIDUAL' },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    attendanceStatus: {
      type: String,
      enum: ['NOT_MARKED', 'PARTIAL', 'COMPLETED'],
      default: 'NOT_MARKED',
    },
    isArchived: { type: Boolean, default: false },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { timestamps: false }
);

// Participant
interface IParticipantDoc extends Document, Omit<IParticipant, 'id'> {}
const ParticipantSchema = new Schema<IParticipantDoc>(
  {
    registrationId: { type: String, required: true, index: true },
    isPrimary: { type: Boolean, default: false },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    usn: { type: String, required: true },
    college: { type: String, required: true },
    department: { type: String, required: true },
    yearSemester: { type: String, required: true },
    githubProfile: { type: String, default: '' },
    linkedinProfile: { type: String, default: '' },
    createdAt: { type: String },
  },
  { timestamps: false }
);

// Team
interface ITeamDoc extends Document, Omit<ITeam, 'id'> {}
const TeamSchema = new Schema<ITeamDoc>(
  {
    registrationId: { type: String, required: true, index: true },
    eventId: { type: String, required: true },
    teamName: { type: String, required: true },
    leaderParticipantId: { type: String, required: true },
    memberParticipantIds: [{ type: String }],
    createdAt: { type: String },
  },
  { timestamps: false }
);

// Payment
interface IPaymentDoc extends Document, Omit<IPayment, 'id'> {}
const PaymentSchema = new Schema<IPaymentDoc>(
  {
    registrationId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    screenshotUrl: { type: String, required: true },
    screenshotMime: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    originalFilename: { type: String },
    fileSize: { type: Number },
    uploadedAt: { type: String },
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    adminNote: { type: String },
    verifiedBy: { type: String },
    verifiedAt: { type: String },
    createdAt: { type: String },
  },
  { timestamps: false }
);

// Attendance
interface IAttendanceDoc extends Document, Omit<IAttendance, 'id'> {}
const AttendanceSchema = new Schema<IAttendanceDoc>(
  {
    registrationId: { type: String, required: true, index: true },
    participantId: { type: String, required: true },
    eventId: { type: String, required: true },
    status: { type: String, enum: ['NOT_MARKED', 'PRESENT', 'ABSENT'], default: 'NOT_MARKED' },
    markedAt: { type: String, required: true },
    markedBy: { type: String, required: true },
  },
  { timestamps: false }
);

// Admin
interface IAdminDoc extends Document, Omit<IAdmin, 'id'> {}
const AdminSchema = new Schema<IAdminDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'VIEWER'], default: 'VIEWER' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: String },
    lastLogin: { type: String },
  },
  { timestamps: false }
);

// Audit Log
interface IAuditLogDoc extends Document, Omit<IAuditLog, 'id'> {}
const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: String, required: true, index: true },
  },
  { timestamps: false }
);

// Settings — one document per key
interface ISettingDoc extends Document {
  key: string;
  value: unknown;
  updatedAt: string;
}
const SettingSchema = new Schema<ISettingDoc>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: String },
  },
  { timestamps: false }
);

// ---------------------------------------------------------------------------
// Model helpers — safe for Next.js hot-reload (avoids OverwriteModelError)
// ---------------------------------------------------------------------------
function getModel<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

function getRegistrationModel() { return getModel<IRegistrationDoc>('Registration', RegistrationSchema); }
function getParticipantModel()  { return getModel<IParticipantDoc>('Participant', ParticipantSchema); }
function getTeamModel()         { return getModel<ITeamDoc>('Team', TeamSchema); }
function getPaymentModel()      { return getModel<IPaymentDoc>('Payment', PaymentSchema); }
function getAttendanceModel()   { return getModel<IAttendanceDoc>('Attendance', AttendanceSchema); }
function getAdminModel()        { return getModel<IAdminDoc>('Admin', AdminSchema); }
function getAuditLogModel()     { return getModel<IAuditLogDoc>('AuditLog', AuditLogSchema); }
function getSettingModel()      { return getModel<ISettingDoc>('Setting', SettingSchema); }

// ---------------------------------------------------------------------------
// Helper: lean doc → typed object with string id
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lean2plain<T>(doc: any): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, __v, ...rest } = doc;
  return { ...rest, id: _id?.toString() ?? '' } as unknown as T;
}

// ---------------------------------------------------------------------------
// Seed required admin accounts once per container
// ---------------------------------------------------------------------------
async function ensureRequiredAdmins(): Promise<void> {
  const Admin = getAdminModel();
  const seeds = [
    { email: 'bennyhinn.icb@gmail.com', fullName: 'Benny Hinn (Super Admin)', password: 'ICB@2005' },
    { email: 'admin@gndec.ac.in',       fullName: 'Lead Organizer (CSE & Cyber)', password: 'Admin@Hacktober2026' },
  ];
  for (const seed of seeds) {
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(seed.password, salt);
    await Admin.findOneAndUpdate(
      { email: seed.email },
      {
        $setOnInsert: { email: seed.email, fullName: seed.fullName, createdAt: new Date().toISOString() },
        $set: { passwordHash, role: 'SUPER_ADMIN', isActive: true },
      },
      { upsert: true }
    );
  }
}

// ---------------------------------------------------------------------------
// Seed default settings once per container
// ---------------------------------------------------------------------------
async function ensureDefaultSettings(): Promise<void> {
  const Setting = getSettingModel();
  const defaults: Record<string, unknown> = {
    pricing: INITIAL_PRICING_CONFIG,
    schedule: INITIAL_SCHEDULE,
    eventInfo: EVENT_INFO,
  };
  for (const [key, value] of Object.entries(defaults)) {
    await Setting.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, value, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  }
}

let _bootstrapped = false;
async function connect(): Promise<void> {
  await connectToDatabase();
  if (!_bootstrapped) {
    _bootstrapped = true;
    await Promise.all([ensureRequiredAdmins(), ensureDefaultSettings()]);
  }
}

// ---------------------------------------------------------------------------
// MongoDB Repository — public API surface (matches dbRepository shape)
// ---------------------------------------------------------------------------
export const mongoRepository = {
  // ── Registrations ──────────────────────────────────────────────────────────
  async createRegistration(data: {
    registration: Omit<IRegistration, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'attendanceStatus'>;
    primaryParticipant: Omit<IParticipant, 'id' | 'registrationId' | 'isPrimary' | 'createdAt'>;
    teamMembers?: Array<Omit<IParticipant, 'id' | 'registrationId' | 'isPrimary' | 'createdAt'>>;
    teamName?: string;
    teamEventId?: string;
    payment: Omit<IPayment, 'id' | 'registrationId' | 'createdAt'> & { status?: PaymentStatus };
  }): Promise<{ registration: IRegistration; payment: IPayment }> {
    await connect();

    // Security: never persist raw base64 to database
    if (data.payment.screenshotUrl?.startsWith('data:')) {
      throw new Error(
        'Security policy violation: Raw image binary/base64 is prohibited in database storage. Cloudinary CDN asset required.'
      );
    }

    const now = new Date().toISOString();
    const { registrationId } = data.registration;

    const regDoc = await getRegistrationModel().create({
      ...data.registration,
      attendanceStatus: 'NOT_MARKED',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    const primaryDoc = await getParticipantModel().create({
      ...data.primaryParticipant,
      registrationId,
      isPrimary: true,
      createdAt: now,
    });

    if (data.teamName && data.teamEventId) {
      const memberIds: string[] = [];
      for (const member of data.teamMembers ?? []) {
        const mDoc = await getParticipantModel().create({
          ...member, registrationId, isPrimary: false, createdAt: now,
        });
        memberIds.push(mDoc._id?.toString() ?? '');
      }
      await getTeamModel().create({
        registrationId,
        eventId: data.teamEventId,
        teamName: data.teamName,
        leaderParticipantId: primaryDoc._id?.toString() ?? '',
        memberParticipantIds: memberIds,
        createdAt: now,
      });
    }

    const payDoc = await getPaymentModel().create({
      ...data.payment,
      registrationId,
      status: data.payment.status ?? data.registration.paymentStatus ?? 'PENDING',
      createdAt: now,
    });

    return {
      registration: lean2plain<IRegistration>(regDoc.toObject({ versionKey: false })),
      payment:       lean2plain<IPayment>(payDoc.toObject({ versionKey: false })),
    };
  },

  async getRegistrationById(registrationId: string): Promise<{
    registration: IRegistration;
    participants: IParticipant[];
    team?: ITeam;
    payment?: IPayment;
    attendance: IAttendance[];
  } | null> {
    await connect();
    const reg = await getRegistrationModel().findOne({ registrationId }).lean();
    if (!reg) return null;

    const [participants, team, payment, attendance] = await Promise.all([
      getParticipantModel().find({ registrationId: reg.registrationId }).lean(),
      getTeamModel().findOne({ registrationId: reg.registrationId }).lean(),
      getPaymentModel().findOne({ registrationId: reg.registrationId }).lean(),
      getAttendanceModel().find({ registrationId: reg.registrationId }).lean(),
    ]);

    return {
      registration: lean2plain<IRegistration>(reg),
      participants: participants.map(lean2plain<IParticipant>),
      team:         team ? lean2plain<ITeam>(team) : undefined,
      payment:      payment ? lean2plain<IPayment>(payment) : undefined,
      attendance:   attendance.map(lean2plain<IAttendance>),
    };
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
    await connect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const regQuery: Record<string, any> = {};
    if (!params.includeArchived) regQuery.isArchived = { $ne: true };
    if (params.eventId && params.eventId !== 'ALL') regQuery.eventIds = params.eventId;
    if (params.paymentStatus && params.paymentStatus !== 'ALL') regQuery.paymentStatus = params.paymentStatus;
    if (params.attendanceStatus && params.attendanceStatus !== 'ALL') regQuery.attendanceStatus = params.attendanceStatus;

    const allRegs = await getRegistrationModel().find(regQuery).lean();
    const regIds = allRegs.map((r) => r.registrationId);

    const [allParts, allTeams, allPayments] = await Promise.all([
      getParticipantModel().find({ registrationId: { $in: regIds } }).lean(),
      getTeamModel().find({ registrationId: { $in: regIds } }).lean(),
      getPaymentModel().find({ registrationId: { $in: regIds } }).lean(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partMap = new Map<string, any[]>();
    for (const p of allParts) { const a = partMap.get(p.registrationId) ?? []; a.push(p); partMap.set(p.registrationId, a); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamMap = new Map<string, any>(allTeams.map((t) => [t.registrationId, t]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payMap  = new Map<string, any>(allPayments.map((p) => [p.registrationId, p]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enriched: any[] = allRegs.map((reg) => {
      const parts   = partMap.get(reg.registrationId) ?? [];
      const primary = parts.find((p) => p.isPrimary) ?? parts[0] ?? null;
      const team    = teamMap.get(reg.registrationId);
      const pay     = payMap.get(reg.registrationId);
      return {
        registration:     lean2plain<IRegistration>(reg),
        primaryParticipant: primary ? lean2plain<IParticipant>(primary) : null,
        teamName:   team?.teamName,
        paymentStatus: pay?.status ?? reg.paymentStatus,
        amount:     reg.totalAmount,
      };
    });

    if (params.department && params.department !== 'ALL')
      enriched = enriched.filter((i) => i.primaryParticipant?.department === params.department);
    if (params.yearSemester && params.yearSemester !== 'ALL')
      enriched = enriched.filter((i) => i.primaryParticipant?.yearSemester === params.yearSemester);
    if (params.search?.trim()) {
      const q = params.search.toLowerCase().trim();
      enriched = enriched.filter((i) =>
        i.registration.registrationId?.toLowerCase().includes(q) ||
        i.primaryParticipant?.fullName?.toLowerCase().includes(q) ||
        i.primaryParticipant?.email?.toLowerCase().includes(q) ||
        i.primaryParticipant?.phone?.toLowerCase().includes(q) ||
        i.primaryParticipant?.usn?.toLowerCase().includes(q) ||
        i.teamName?.toLowerCase().includes(q)
      );
    }

    const order = params.sortOrder === 'asc' ? 1 : -1;
    const sortKey = params.sortBy || 'createdAt';
    enriched.sort((a, b) => {
      if (sortKey === 'createdAt') return (new Date(a.registration.createdAt).getTime() - new Date(b.registration.createdAt).getTime()) * order;
      if (sortKey === 'amount')    return (a.amount - b.amount) * order;
      if (sortKey === 'name')      return (a.primaryParticipant?.fullName || '').localeCompare(b.primaryParticipant?.fullName || '') * order;
      return 0;
    });

    const total      = enriched.length;
    const page       = Math.max(1, params.page || 1);
    const limit      = Math.max(1, params.limit || 15);
    const totalPages = Math.ceil(total / limit) || 1;
    return { items: enriched.slice((page - 1) * limit, page * limit), total, page, totalPages };
  },

  async updatePaymentStatus(registrationId: string, status: PaymentStatus, adminEmail: string, adminNote?: string): Promise<boolean> {
    await connect();
    const now = new Date().toISOString();
    const reg = await getRegistrationModel().findOneAndUpdate({ registrationId }, { $set: { paymentStatus: status, updatedAt: now } });
    if (!reg) return false;
    const payUpdate: Record<string, unknown> = { status, verifiedBy: adminEmail, verifiedAt: now };
    if (adminNote) payUpdate.adminNote = adminNote;
    await getPaymentModel().findOneAndUpdate({ registrationId }, { $set: payUpdate });
    this.addAuditLog({ adminId: adminEmail, adminEmail, action: `PAYMENT_${status}`, resource: 'PAYMENT', resourceId: registrationId, metadata: { status, adminNote } });
    return true;
  },

  async toggleArchiveRegistration(registrationId: string, adminEmail: string, archive = true): Promise<boolean> {
    await connect();
    const now = new Date().toISOString();
    const reg = await getRegistrationModel().findOneAndUpdate({ registrationId }, { $set: { isArchived: archive, updatedAt: now } });
    if (!reg) return false;
    this.addAuditLog({ adminId: adminEmail, adminEmail, action: archive ? 'REGISTRATION_ARCHIVED' : 'REGISTRATION_RESTORED', resource: 'REGISTRATION', resourceId: registrationId });
    return true;
  },

  // ── Attendance ─────────────────────────────────────────────────────────────
  async markAttendance(data: { registrationId: string; participantId: string; eventId: string; adminEmail: string; }): Promise<{ success: boolean; alreadyMarked: boolean; attendance?: IAttendance }> {
    await connect();
    const existing = await getAttendanceModel().findOne({ registrationId: data.registrationId, participantId: data.participantId, eventId: data.eventId, status: 'PRESENT' }).lean();
    if (existing) return { success: true, alreadyMarked: true, attendance: lean2plain<IAttendance>(existing) };

    const now = new Date().toISOString();
    const newDoc = await getAttendanceModel().create({ ...data, status: 'PRESENT', markedAt: now, markedBy: data.adminEmail });

    const reg = await getRegistrationModel().findOne({ registrationId: data.registrationId });
    if (reg) {
      const attended = await getAttendanceModel().countDocuments({ registrationId: data.registrationId, status: 'PRESENT' });
      await getRegistrationModel().findOneAndUpdate({ registrationId: data.registrationId }, { $set: { attendanceStatus: attended >= reg.eventIds.length ? 'COMPLETED' : 'PARTIAL', updatedAt: now } });
    }

    this.addAuditLog({ adminId: data.adminEmail, adminEmail: data.adminEmail, action: 'ATTENDANCE_MARKED', resource: 'ATTENDANCE', resourceId: data.registrationId, metadata: { eventId: data.eventId, participantId: data.participantId } });
    return { success: true, alreadyMarked: false, attendance: lean2plain<IAttendance>(newDoc.toObject({ versionKey: false })) };
  },

  // ── Dashboard Analytics ────────────────────────────────────────────────────
  async getDashboardAnalytics(): Promise<{
    totalRegistrations: number; paidRegistrations: number; pendingPayments: number; rejectedPayments: number;
    totalParticipants: number; totalTeams: number; totalRevenue: number; totalAttendance: number;
    eventParticipation: Record<string, number>;
    recentRegistrations: Array<{ registrationId: string; name: string; events: string[]; amount: number; paymentStatus: PaymentStatus; createdAt: string; }>;
  }> {
    await connect();
    const [total, paid, pending, rejected, parts, teams, att] = await Promise.all([
      getRegistrationModel().countDocuments({ isArchived: { $ne: true } }),
      getRegistrationModel().countDocuments({ isArchived: { $ne: true }, paymentStatus: 'VERIFIED' }),
      getRegistrationModel().countDocuments({ isArchived: { $ne: true }, paymentStatus: 'PENDING' }),
      getRegistrationModel().countDocuments({ isArchived: { $ne: true }, paymentStatus: 'REJECTED' }),
      getParticipantModel().countDocuments({}),
      getTeamModel().countDocuments({}),
      getAttendanceModel().countDocuments({ status: 'PRESENT' }),
    ]);

    const revenueAgg = await getRegistrationModel().aggregate([{ $match: { isArchived: { $ne: true }, paymentStatus: 'VERIFIED' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
    const totalRevenue: number = revenueAgg[0]?.total ?? 0;

    const eventCounts: Record<string, number> = { 'cyber-quiz': 0, 'cyber-debate': 0, 'mini-hackathon': 0, 'cyber-hunt': 0, 'tech-debug': 0 };
    const eventAgg = await getRegistrationModel().aggregate([{ $match: { isArchived: { $ne: true } } }, { $unwind: '$eventIds' }, { $group: { _id: '$eventIds', count: { $sum: 1 } } }]);
    for (const r of eventAgg) eventCounts[r._id] = r.count;

    const recent = await getRegistrationModel().find({ isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(6).lean();
    const recentIds = recent.map((r) => r.registrationId);
    const recentParts = await getParticipantModel().find({ registrationId: { $in: recentIds }, isPrimary: true }).lean();
    const pMap = new Map(recentParts.map((p) => [p.registrationId, p.fullName]));

    return {
      totalRegistrations: total, paidRegistrations: paid, pendingPayments: pending, rejectedPayments: rejected,
      totalParticipants: parts, totalTeams: teams, totalRevenue, totalAttendance: att,
      eventParticipation: eventCounts,
      recentRegistrations: recent.map((r) => ({ registrationId: r.registrationId, name: pMap.get(r.registrationId) ?? 'Participant', events: r.eventIds, amount: r.totalAmount, paymentStatus: r.paymentStatus as PaymentStatus, createdAt: r.createdAt })),
    };
  },

  // ── Teams ──────────────────────────────────────────────────────────────────
  async listTeams(): Promise<Array<{ team: ITeam; registration: IRegistration | null; leader: IParticipant | null; members: IParticipant[]; paymentStatus: PaymentStatus; }>> {
    await connect();
    const teams = await getTeamModel().find({}).lean();
    const regIds    = teams.map((t) => t.registrationId);
    const leaderIds = teams.map((t) => t.leaderParticipantId);
    const memberIds = teams.flatMap((t) => t.memberParticipantIds);

    const [regs, allParts] = await Promise.all([
      getRegistrationModel().find({ registrationId: { $in: regIds } }).lean(),
      getParticipantModel().find({ registrationId: { $in: regIds } }).lean(),
    ]);

    const regMap  = new Map(regs.map((r) => [r.registrationId, r]));
    const partById = new Map(allParts.map((p) => [p._id?.toString(), p]));
    void leaderIds; void memberIds; // used via partById lookup below

    return teams.map((t) => {
      const reg    = regMap.get(t.registrationId) ?? null;
      const leader = partById.get(t.leaderParticipantId) ?? null;
      const members = t.memberParticipantIds.map((mid) => partById.get(mid)).filter(Boolean);
      return {
        team:         lean2plain<ITeam>(t),
        registration: reg ? lean2plain<IRegistration>(reg) : null,
        leader:       leader ? lean2plain<IParticipant>(leader) : null,
        members:      members.map(lean2plain<IParticipant>),
        paymentStatus: (reg?.paymentStatus ?? 'PENDING') as PaymentStatus,
      };
    });
  },

  // ── Admins & RBAC ──────────────────────────────────────────────────────────
  async findAdminByEmail(email: string): Promise<IAdmin | null> {
    await connect();
    const doc = await getAdminModel().findOne({ email: email.toLowerCase(), isActive: true }).lean();
    return doc ? lean2plain<IAdmin>(doc) : null;
  },

  async listAdmins(): Promise<Array<Omit<IAdmin, 'passwordHash'>>> {
    await connect();
    const docs = await getAdminModel().find({}).lean();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return docs.map(({ passwordHash: _ph, ...rest }) => lean2plain<Omit<IAdmin, 'passwordHash'>>(rest));
  },

  async createAdmin(data: { email: string; password: string; fullName: string; role: AdminRole; creatorEmail: string; }): Promise<Omit<IAdmin, 'passwordHash'>> {
    await connect();
    const existing = await getAdminModel().findOne({ email: data.email.toLowerCase() });
    if (existing) throw new Error('An organizer account with this email already exists.');

    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(data.password, salt);
    const doc = await getAdminModel().create({ email: data.email.toLowerCase().trim(), passwordHash, fullName: data.fullName, role: data.role, isActive: true, createdAt: new Date().toISOString() });

    this.addAuditLog({ adminId: data.creatorEmail, adminEmail: data.creatorEmail, action: 'ORGANIZER_CREATED', resource: 'ADMIN', resourceId: doc._id?.toString() ?? '', metadata: { role: data.role, email: data.email } });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...rest } = doc.toObject({ versionKey: false });
    return lean2plain<Omit<IAdmin, 'passwordHash'>>(rest);
  },

  async updateAdminRole(adminId: string, role: AdminRole, creatorEmail: string): Promise<boolean> {
    await connect();
    const doc = await getAdminModel().findByIdAndUpdate(adminId, { $set: { role } });
    if (!doc) return false;
    this.addAuditLog({ adminId: creatorEmail, adminEmail: creatorEmail, action: 'ORGANIZER_ROLE_CHANGED', resource: 'ADMIN', resourceId: adminId, metadata: { newRole: role } });
    return true;
  },

  async toggleAdminActive(adminId: string, isActive: boolean, creatorEmail: string): Promise<boolean> {
    await connect();
    const doc = await getAdminModel().findByIdAndUpdate(adminId, { $set: { isActive } });
    if (!doc) return false;
    this.addAuditLog({ adminId: creatorEmail, adminEmail: creatorEmail, action: isActive ? 'ORGANIZER_ACTIVATED' : 'ORGANIZER_DEACTIVATED', resource: 'ADMIN', resourceId: adminId });
    return true;
  },

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  addAuditLog(data: Omit<IAuditLog, 'id' | 'timestamp'>): void {
    connect()
      .then(async () => {
        await getAuditLogModel().create({ ...data, timestamp: new Date().toISOString() });
      })
      .catch((err) => console.error('[mongoRepository] addAuditLog failed:', err));
  },

  async listAuditLogs(limit = 100): Promise<IAuditLog[]> {
    await connect();
    const docs = await getAuditLogModel().find({}).sort({ timestamp: -1 }).limit(limit).lean();
    return docs.map(lean2plain<IAuditLog>);
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  async getSettings(): Promise<Record<string, unknown>> {
    await connect();
    const docs = await getSettingModel().find({}).lean();
    return Object.fromEntries(docs.map((d) => [d.key, d.value]));
  },

  async updateSetting(key: string, value: unknown, adminEmail: string): Promise<void> {
    await connect();
    await getSettingModel().findOneAndUpdate({ key }, { $set: { value, updatedAt: new Date().toISOString() } }, { upsert: true });
    this.addAuditLog({ adminId: adminEmail, adminEmail, action: `SETTING_UPDATED_${key.toUpperCase()}`, resource: 'SETTING', resourceId: key, metadata: { key } });
  },
};
