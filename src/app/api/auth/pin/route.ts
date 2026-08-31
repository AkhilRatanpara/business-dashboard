import { NextRequest, NextResponse } from 'next/server';
import { verifyPin, updatePin } from '@/lib/pin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'gunatit_auth_pin';

export async function GET() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  const isAuthenticated = authCookie?.value === 'authenticated';

  return NextResponse.json({ authenticated: isAuthenticated });
}

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ success: false, message: 'PIN must be exactly 4 digits.' }, { status: 400 });
    }

    const isValid = await verifyPin(pin);

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid 4-digit security PIN.' }, { status: 401 });
    }

    // Set secure cookie valid for 30 days
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
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

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error updating PIN:', error);
    return NextResponse.json({ success: false, message: 'Failed to update security PIN.' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ success: true, message: 'Logged out successfully.' });
}
