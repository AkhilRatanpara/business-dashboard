import bcrypt from 'bcryptjs';
import { prisma } from './db';

const DEFAULT_PIN = '1234';

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
    // Fallback in case DB is still connecting
    const defaultHash = await bcrypt.hash(DEFAULT_PIN, 10);
    return {
      id: 'settings',
      pinHash: defaultHash,
      themeMode: 'dark',
      updatedAt: new Date(),
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
 * Update the 4-digit PIN in Neon PostgreSQL
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

  await prisma.systemSettings.upsert({
    where: { id: 'settings' },
    update: { pinHash: newHash },
    create: {
      id: 'settings',
      pinHash: newHash,
      themeMode: 'dark',
    },
  });

  return { success: true, message: 'Security PIN updated successfully.' };
}
