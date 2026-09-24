import fs from 'fs';
import path from 'path';

export interface ExpiryStatusResult {
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';
  daysRemaining: number | null;
  statusLabel: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'secondary' | 'critical';
}

/**
 * Calculates dynamic expiry status according to business requirements:
 * > 10 days: ACTIVE (Normal)
 * 10, 8, 5 days: EXPIRING_SOON (Warning)
 * 3, 2 days: EXPIRING_SOON (High Warning)
 * 1 day: EXPIRING_SOON (Critical)
 * 0 days / <= 0 days: EXPIRED (Danger)
 */
export function calculateDocumentExpiryStatus(expiryDateStr?: string | null): ExpiryStatusResult {
  if (!expiryDateStr) {
    return {
      status: 'NO_EXPIRY',
      daysRemaining: null,
      statusLabel: 'No Expiry',
      badgeVariant: 'secondary',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateStr);
  expDate.setHours(0, 0, 0, 0);

  if (isNaN(expDate.getTime())) {
    return {
      status: 'NO_EXPIRY',
      daysRemaining: null,
      statusLabel: 'Invalid Date',
      badgeVariant: 'secondary',
    };
  }

  const diffTime = expDate.getTime() - today.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      status: 'EXPIRED',
      daysRemaining: days,
      statusLabel: `Expired (${Math.abs(days)}d ago)`,
      badgeVariant: 'danger',
    };
  }

  if (days === 0) {
    return {
      status: 'EXPIRED',
      daysRemaining: 0,
      statusLabel: 'Expiring Today',
      badgeVariant: 'danger',
    };
  }

  if (days === 1) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining: 1,
      statusLabel: '1 Day Remaining',
      badgeVariant: 'critical',
    };
  }

  if (days <= 3) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining: days,
      statusLabel: `${days} Days Remaining`,
      badgeVariant: 'critical',
    };
  }

  if (days <= 10) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining: days,
      statusLabel: `${days} Days Remaining`,
      badgeVariant: 'warning',
    };
  }

  return {
    status: 'ACTIVE',
    daysRemaining: days,
    statusLabel: `Active (${days}d left)`,
    badgeVariant: 'success',
  };
}

/**
 * Validates issue and expiry dates:
 * - Issue date cannot be after expiry date
 */
export function validateDateRange(issueDate?: string | null, expiryDate?: string | null): void {
  if (issueDate && expiryDate) {
    const issue = new Date(issueDate);
    const expiry = new Date(expiryDate);
    if (!isNaN(issue.getTime()) && !isNaN(expiry.getTime()) && issue > expiry) {
      throw new Error(`Issue date (${issueDate}) cannot be after expiry date (${expiryDate}).`);
    }
  }
}

/**
 * Stores base64 file to uploads/documents and returns file path and size.
 */
export function saveBase64DocumentFile(
  base64Content: string,
  fileName: string | undefined,
  entityType: string,
  entityId: number | string
): { filePath: string; fileSize: number; mimeType: string } {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let mimeType = 'application/pdf';
  let buffer: Buffer;

  const matches = base64Content.match(/^data:(.+);base64,(.+)$/);
  if (matches) {
    mimeType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(base64Content, 'base64');
  }

  // Validate file size limit: 15MB
  if (buffer.length > 15 * 1024 * 1024) {
    throw new Error('File size exceeds maximum allowed limit of 15MB.');
  }

  const ext = fileName ? path.extname(fileName) : '.pdf';
  const cleanExt = ext || '.pdf';
  const uniqueName = `${entityType}_${entityId}_${Date.now()}_${Math.floor(Math.random() * 1000)}${cleanExt}`;
  const targetPath = path.join(uploadsDir, uniqueName);

  fs.writeFileSync(targetPath, buffer);

  return {
    filePath: `/uploads/documents/${uniqueName}`,
    fileSize: buffer.length,
    mimeType,
  };
}
