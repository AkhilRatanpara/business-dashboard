import { NextRequest, NextResponse } from 'next/server';
import { verifyPin, updatePin, UserRole } from '@/lib/pin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTH_COOKIE_NAME = 'gunatit_auth_pin';
const AUTH_ROLE_COOKIE_NAME = 'gunatit_auth_role';

export async function GET() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  const roleCookie = cookieStore.get(AUTH_ROLE_COOKIE_NAME);
  
  const isAuthenticated = authCookie?.value === 'authenticated';
  const role = (roleCookie?.value as UserRole) || (isAuthenticated ? 'editor' : undefined);

  return NextResponse.json({ authenticated: isAuthenticated, role });
}

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ success: false, message: 'PIN must be exactly 4 digits.' }, { status: 400 });
    }

    const result = await verifyPin(pin);

    if (!result.valid || !result.role) {
      return NextResponse.json({ success: false, message: 'Invalid 4-digit security PIN.' }, { status: 401 });
    }

    // Set secure cookies valid for 30 days
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    cookieStore.set(AUTH_ROLE_COOKIE_NAME, result.role, {
      httpOnly: false, // accessible to client for instant UI role responsiveness
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      role: result.role,
      message: result.role === 'editor' ? 'Editor access granted.' : 'Viewer (Read-Only) access granted.',
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json({ success: false, message: 'Server error verifying PIN.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { targetRole = 'editor', currentPin, newPin } = await req.json();

    if (!currentPin || !newPin) {
      return NextResponse.json({ success: false, message: 'Both current Editor PIN and new PIN are required.' }, { status: 400 });
    }

    const result = await updatePin(targetRole as UserRole, currentPin, newPin);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error updating PIN:', error);
    return NextResponse.json({ success: false, message: 'Failed to update security PIN.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(AUTH_ROLE_COOKIE_NAME);
  return NextResponse.json({ success: true, message: 'Logged out successfully.' });
}
