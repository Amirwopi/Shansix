import { NextResponse } from 'next/server';

function buildLogoutResponse(response: NextResponse) {
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  return buildLogoutResponse(response);
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/', request.url));
  return buildLogoutResponse(response);
}
