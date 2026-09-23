import { z } from 'zod';
import { OFFICIAL_EVENTS, ALLOWED_SEMESTERS } from './constants';

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
    .min(1, 'Semester is required')
    .refine(
      (val) => (ALLOWED_SEMESTERS as readonly string[]).includes(val),
      { message: 'Semester must be 1st Sem, 3rd Sem, 5th Sem, or 7th Sem' }
    ),
  githubProfile: z.string().trim().optional(),
  linkedinProfile: z.string().trim().optional(),
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
  paidTo: z.string().trim().max(100).optional(),
  screenshotName: z.string().trim().max(150).optional(),
  screenshotData: z
    .string()
    .min(10, 'Payment screenshot proof is required')
    .max(7_500_000, 'Screenshot file size exceeds 5MB limit')
    .refine((val) => {
      const allowedPrefixes = [
        'data:image/png;base64,',
        'data:image/jpeg;base64,',
        'data:image/jpg;base64,',
        'data:image/webp;base64,',
      ];
      return allowedPrefixes.some((prefix) => val.toLowerCase().startsWith(prefix));
    }, 'Screenshot must be a valid image file (PNG, JPG, JPEG, WEBP)'),
});

export const AdminLoginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(100, 'Email address too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
});
