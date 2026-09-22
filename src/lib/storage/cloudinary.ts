// Cloudinary Server-Side Storage Service (Production Storage Only)
// Enforces server-side validation (5MB limit, PNG/JPG/WEBP), magic byte verification,
// and strictly rejects inline/base64 database storage fallback.
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export const MAX_PAYMENT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface UploadedPaymentProof {
  cloudinaryPublicId: string;
  secureUrl: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Configure Cloudinary dynamically from server-side environment variables
 */
export function initCloudinary(): boolean {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    const match = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) {
      apiKey = match[1];
      apiSecret = match[2];
      cloudName = match[3];
    }
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }
  return false;
}

// Initial configuration attempt
initCloudinary();

/**
 * Checks if Cloudinary is configured with valid credentials
 */
export function isCloudinaryConfigured(): boolean {
  initCloudinary();
  const config = cloudinary.config();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
}

/**
 * Validates buffer magic bytes against allowed image formats (PNG, JPEG, WEBP)
 */
export function validateImageBuffer(buffer: Buffer): { isValid: boolean; detectedMime: string } {
  if (buffer.length < 12) {
    return { isValid: false, detectedMime: '' };
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedMime: 'image/png' };
  }

  // JPEG signature: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: 'image/jpeg' };
  }

  // WEBP signature: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMime: 'image/webp' };
  }

  return { isValid: false, detectedMime: '' };
}

/**
 * Upload a payment screenshot to Cloudinary.
 *
 * Requirements:
 * 1. Cloudinary is the ONLY storage mechanism (zero fallback to database/base64).
 * 2. Strict file size validation (max 5 MB).
 * 3. Strict MIME type & magic byte verification (JPG, JPEG, PNG, WEBP).
 * 4. Throws on any failure to guarantee no incomplete or corrupted proof is accepted.
 */
export async function uploadPaymentScreenshot(
  fileData: string,
  registrationId: string,
  originalFilename?: string
): Promise<UploadedPaymentProof> {
  // Ensure Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary storage service is unconfigured. Payment proof cannot be processed.');
  }

  if (!fileData || typeof fileData !== 'string') {
    throw new Error('Payment screenshot proof data is missing or invalid.');
  }

  // Parse and extract base64 binary
  const dataUriMatch = fileData.match(/^data:([^;]+);base64,(.+)$/);
  if (!dataUriMatch) {
    throw new Error('Invalid payment screenshot format. Must be a valid base64 data URI.');
  }

  const declaredMime = dataUriMatch[1].toLowerCase();
  const base64Content = dataUriMatch[2];

  // Convert to Buffer for server-side byte validation
  const buffer = Buffer.from(base64Content, 'base64');

  // Validate file size (max 5 MB)
  if (buffer.length === 0) {
    throw new Error('Payment screenshot file is empty.');
  }

  if (buffer.length > MAX_PAYMENT_FILE_SIZE_BYTES) {
    const sizeInMb = (buffer.length / (1024 * 1024)).toFixed(2);
    throw new Error(`File size (${sizeInMb} MB) exceeds maximum permitted limit of 5 MB.`);
  }

  // Validate declared MIME type
  const normalizedMime = declaredMime === 'image/jpg' ? 'image/jpeg' : declaredMime;
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(normalizedMime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new Error(`Invalid image type (${declaredMime}). Allowed formats: JPG, JPEG, PNG, WEBP.`);
  }

  // Validate buffer magic bytes
  const magicValidation = validateImageBuffer(buffer);
  if (!magicValidation.isValid || magicValidation.detectedMime !== normalizedMime) {
    throw new Error('File content does not match expected image format (corrupted or forged file).');
  }

  // Sanitize filename and public ID
  const sanitizedFilename = originalFilename
    ? originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)
    : `receipt_${registrationId.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;

  const safePublicId = `receipt_${registrationId.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_${Date.now()}`;

  try {
    const response: UploadApiResponse = await cloudinary.uploader.upload(fileData, {
      folder: 'hacktober2026/payments',
      public_id: safePublicId,
      resource_type: 'image',
      overwrite: true,
      tags: ['hacktober2026', 'payment_proof', registrationId],
    });

    if (!response.secure_url || !response.public_id) {
      throw new Error('Cloudinary upload response missing secure URL or public ID.');
    }

    return {
      cloudinaryPublicId: response.public_id,
      secureUrl: response.secure_url,
      originalFilename: sanitizedFilename,
      mimeType: magicValidation.detectedMime,
      fileSize: response.bytes || buffer.length,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const safeErrorMsg = error instanceof Error ? error.message : 'Unknown Cloudinary error';
    // Log without exposing API secrets or credentials
    console.error('[Cloudinary] Storage upload rejected:', safeErrorMsg);
    throw new Error(`Failed to securely upload payment proof to Cloudinary: ${safeErrorMsg}`);
  }
}

export { cloudinary };
