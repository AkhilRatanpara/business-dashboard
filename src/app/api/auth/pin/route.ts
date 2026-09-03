import { NextRequest, NextResponse } from 'next/server';
import { verifyPin, updatePin, createSessionToken, validateSessionToken } from '@/lib/pin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'gunatit_auth_pin';
const SESSION_MAX_AGE = 20 * 60; // 20 minutes strict inactivity timeout

export async function GET() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  const isValid = await validateSessionToken(authCookie?.value);

  if (isValid && authCookie?.value) {
    // Rolling 20-minute session renewal for active sessions
    cookieStore.set(AUTH_COOKIE_NAME, authCookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    return NextResponse.json({ authenticated: true });
  }

  // If token is invalid or expired, ensure cookie is cleared
  if (authCookie) {
    cookieStore.delete(AUTH_COOKIE_NAME);
  }

  return NextResponse.json({ authenticated: false });
}

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ success: false, message: 'PIN must be exactly 4 numeric digits.' }, { status: 400 });
    }

    const isValid = await verifyPin(pin);

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid 4-digit security PIN.' }, { status: 401 });
    }

    // Generate cryptographic session token bound to the current database PIN timestamp
    const sessionToken = await createSessionToken();

    // Set secure cookie strictly bound to 20-minute inactivity window
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Access granted.' });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json({ success: false, message: 'Server error verifying PIN.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { currentPin, newPin } = await req.json();

    if (!currentPin || !newPin) {
      return NextResponse.json({ success: false, message: 'Both current PIN and new PIN are required.' }, { status: 400 });
    }

    const result = await updatePin(currentPin, newPin);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    // Changing the PIN in database changes updatedAt, immediately invalidating all devices.
    // Clear cookie so this device also locks to the new PIN.
    const cookieStore = cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'PIN updated successfully. All active sessions across all devices have been locked.',
    });
  } catch (error) {
    console.error('Error updating PIN:', error);
    return NextResponse.json({ success: false, message: 'Failed to update security PIN.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return PUT(req);
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ success: true, message: 'Session locked and logged out successfully.' });
}
