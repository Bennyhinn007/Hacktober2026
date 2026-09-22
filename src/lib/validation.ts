import { z } from 'zod';
import { OFFICIAL_EVENTS } from './constants';

const VALID_EVENT_IDS = OFFICIAL_EVENTS.map((e) => e.id);

export const ParticipantSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,15}$/, 'Please enter a valid 10-15 digit phone number'),
  usn: z
    .string()
    .trim()
    .min(3, 'USN / Student ID must be at least 3 characters')
    .max(30, 'USN / Student ID is too long')
    .toUpperCase(),
  college: z
    .string()
    .trim()
    .min(2, 'College name must be at least 2 characters')
    .max(150, 'College name is too long'),
  department: z
    .string()
    .trim()
    .min(2, 'Department is required'),
  yearSemester: z
    .string()
    .trim()
    .min(1, 'Year / Semester is required'),
  githubProfile: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val.startsWith('http') || val.startsWith('github.com'), {
      message: 'Invalid GitHub profile URL',
    }),
  linkedinProfile: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val.startsWith('http') || val.startsWith('linkedin.com'), {
      message: 'Invalid LinkedIn profile URL',
    }),
});

export const TeamMemberSchema = z.object({
  fullName: z.string().trim().min(2, 'Member name must be at least 2 characters'),
  email: z.string().trim().email('Valid member email required').toLowerCase(),
  phone: z.string().trim().regex(/^[0-9+\-\s]{10,15}$/, 'Valid 10-15 digit phone required'),
  usn: z.string().trim().min(3, 'Member USN is required').toUpperCase(),
  college: z.string().trim().min(2, 'Member college is required'),
  department: z.string().trim().min(2, 'Member department is required'),
  yearSemester: z.string().trim().min(1, 'Member year/semester is required'),
});

export const RegistrationWizardSchema = z.object({
  selectedEventIds: z
    .array(z.string())
    .min(1, 'Please select at least 1 event')
    .refine(
      (ids) => ids.every((id) => VALID_EVENT_IDS.includes(id)),
      'One or more selected events are invalid'
    ),
  primaryParticipant: ParticipantSchema,
  teamName: z.string().trim().max(60).optional(),
  teamMembers: z.array(TeamMemberSchema).max(3).optional(),
  transactionId: z
    .string()
    .trim()
    .min(6, 'Transaction ID / UTR must be at least 6 characters')
    .max(50, 'Transaction ID is too long'),
  screenshotData: z
    .string()
    .min(10, 'Payment screenshot proof is required')
    .refine(
      (val) => val.startsWith('data:image/') || val.startsWith('http'),
      'Screenshot must be a valid image file (PNG, JPG, JPEG, WEBP)'
    ),
});

export const AdminLoginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
