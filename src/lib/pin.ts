import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const DEFAULT_EDITOR_PIN = '4142';
export const DEFAULT_VIEWER_PIN = '1250';

export type UserRole = 'editor' | 'viewer';

export interface VerifyPinResult {
  valid: boolean;
  role?: UserRole;
  message?: string;
}

/**
 * Get or initialize system settings with default 4-digit PINs (Editor: 4142, Viewer: 1250)
 */
export async function getSystemSettings() {
  try {
    let settings = await (prisma.systemSettings as any).findUnique({
      where: { id: 'settings' },
    });

    const defaultEditorHash = await bcrypt.hash(DEFAULT_EDITOR_PIN, 10);
    const defaultViewerHash = await bcrypt.hash(DEFAULT_VIEWER_PIN, 10);

    if (!settings) {
      settings = await (prisma.systemSettings as any).create({
        data: {
          id: 'settings',
          pinHash: defaultEditorHash,
          viewerPinHash: defaultViewerHash,
          themeMode: 'dark',
        },
      });
    } else if (!settings.viewerPinHash) {
      // Backfill viewer pin hash if it didn't exist
      settings = await (prisma.systemSettings as any).update({
        where: { id: 'settings' },
        data: { viewerPinHash: defaultViewerHash },
      });
    }

    return settings;
  } catch (error) {
    console.error('Error fetching system settings from database:', error);
    const defaultEditorHash = await bcrypt.hash(DEFAULT_EDITOR_PIN, 10);
    const defaultViewerHash = await bcrypt.hash(DEFAULT_VIEWER_PIN, 10);
    return {
      id: 'settings',
      pinHash: defaultEditorHash,
      viewerPinHash: defaultViewerHash,
      themeMode: 'dark',
      updatedAt: new Date(),
    };
  }
}

/**
 * Verify if entered 4-digit PIN matches either Editor PIN or Viewer PIN
 */
export async function verifyPin(enteredPin: string): Promise<VerifyPinResult> {
  if (!enteredPin || enteredPin.length !== 4) {
    return { valid: false, message: 'PIN must be exactly 4 digits.' };
  }

  const settings = await getSystemSettings();

  // Check Editor PIN
  const isEditor = await bcrypt.compare(enteredPin, settings.pinHash);
  if (isEditor) {
    return { valid: true, role: 'editor' };
  }

  // Check Viewer PIN
  const viewerHash = settings.viewerPinHash || (await bcrypt.hash(DEFAULT_VIEWER_PIN, 10));
  const isViewer = await bcrypt.compare(enteredPin, viewerHash);
  if (isViewer) {
    return { valid: true, role: 'viewer' };
  }

  return { valid: false, message: 'Invalid 4-digit security PIN.' };
}

/**
 * Update Editor PIN or Viewer PIN in Neon PostgreSQL
 */
export async function updatePin(
  targetRole: UserRole,
  currentEditorPin: string,
  newPin: string
): Promise<{ success: boolean; message: string }> {
  if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return { success: false, message: 'New PIN must be exactly 4 numeric digits.' };
  }

  // Verify that current Editor PIN is provided and correct before allowing changes
  const verifyResult = await verifyPin(currentEditorPin);
  if (!verifyResult.valid || verifyResult.role !== 'editor') {
    return { success: false, message: 'Current Editor Security PIN is incorrect.' };
  }

  const newHash = await bcrypt.hash(newPin, 10);

  if (targetRole === 'editor') {
    await (prisma.systemSettings as any).upsert({
      where: { id: 'settings' },
      update: { pinHash: newHash },
      create: {
        id: 'settings',
        pinHash: newHash,
        viewerPinHash: await bcrypt.hash(DEFAULT_VIEWER_PIN, 10),
        themeMode: 'dark',
      },
    });
    return { success: true, message: 'Editor Security PIN (Full Access) updated successfully.' };
  } else {
    await (prisma.systemSettings as any).upsert({
      where: { id: 'settings' },
      update: { viewerPinHash: newHash },
      create: {
        id: 'settings',
        pinHash: await bcrypt.hash(DEFAULT_EDITOR_PIN, 10),
        viewerPinHash: newHash,
        themeMode: 'dark',
      },
    });
    return { success: true, message: 'Viewer Security PIN (Read Only) updated successfully.' };
  }
}
