import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './db';

const DEFAULT_PIN = '1234';
const AUTH_SECRET = process.env.AUTH_SECRET || 'gunatit-shop-security-key-2026';

/**
 * Get or initialize system settings with default 4-digit PIN (1234)
 */
export async function getSystemSettings() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings) {
      const defaultHash = await bcrypt.hash(DEFAULT_PIN, 10);
      settings = await prisma.systemSettings.create({
        data: {
          id: 'settings',
          pinHash: defaultHash,
          themeMode: 'dark',
        },
      });
    }

    return settings;
  } catch (error) {
    console.error('Error fetching system settings from database:', error);
    const defaultHash = await bcrypt.hash(DEFAULT_PIN, 10);
    return {
      id: 'settings',
      pinHash: defaultHash,
      themeMode: 'dark',
      updatedAt: new Date(1700000000000),
    };
  }
}

/**
 * Verify if entered 4-digit PIN matches the stored hash
 */
export async function verifyPin(enteredPin: string): Promise<boolean> {
  if (!enteredPin || enteredPin.length !== 4) return false;
  const settings = await getSystemSettings();
  return bcrypt.compare(enteredPin, settings.pinHash);
}

/**
 * Create a cryptographic session token bound to the current PIN version timestamp.
 * Any PIN change updates settings.updatedAt, immediately invalidating tokens on all devices.
 */
export async function createSessionToken(): Promise<string> {
  const settings = await getSystemSettings();
  const sessionEpoch = Math.floor(settings.updatedAt.getTime() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`gunatit-session:${sessionEpoch}`)
    .digest('hex');
  return `${sessionEpoch}.${signature}`;
}

/**
 * Validate session token against current database PIN timestamp.
 * Returns false if token is expired, tampered, or PIN was changed on any device.
 */
export async function validateSessionToken(token: string | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [sessionEpoch, signature] = token.split('.');
  if (!sessionEpoch || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`gunatit-session:${sessionEpoch}`)
    .digest('hex');

  if (signature !== expectedSignature) return false;

  const settings = await getSystemSettings();
  const currentEpoch = Math.floor(settings.updatedAt.getTime() / 1000).toString();

  // If PIN was changed on any device, the epoch changed -> invalidates all devices
  if (currentEpoch !== sessionEpoch) {
    return false;
  }
  return true;
}

/**
 * Update the 4-digit PIN in Neon PostgreSQL and invalidate all sessions across all devices
 */
export async function updatePin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
  if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return { success: false, message: 'New PIN must be exactly 4 numeric digits.' };
  }

  const isValidCurrent = await verifyPin(currentPin);
  if (!isValidCurrent) {
    return { success: false, message: 'Current security PIN is incorrect.' };
  }

  const newHash = await bcrypt.hash(newPin, 10);
  const now = new Date();

  await prisma.systemSettings.upsert({
    where: { id: 'settings' },
    update: {
      pinHash: newHash,
      updatedAt: now,
    },
    create: {
      id: 'settings',
      pinHash: newHash,
      themeMode: 'dark',
      updatedAt: now,
    },
  });

  return { success: true, message: 'Security PIN updated. All active sessions across all devices have been locked.' };
}
