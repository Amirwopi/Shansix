import { NextResponse } from 'next/server';

function getRedirectBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) {
    return configured;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.url;
}

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto === 'https';
  }
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

function buildLogoutResponse(request: Request, response: NextResponse) {
  const secure = isSecureRequest(request);

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  return response;
}

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  return buildLogoutResponse(request, response);
}

export async function GET(request: Request) {
  const base = getRedirectBaseUrl(request);
  const response = NextResponse.redirect(new URL('/', base));
  return buildLogoutResponse(request, response);
}
