import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import HomeClient from './HomeClient';

const JWT_SECRET = process.env.JWT_SECRET || '';
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || '09337309575';

export default async function LotteryHomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token && JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      const mobile = (payload.mobile as string | undefined) || '';
      redirect(mobile && ADMIN_MOBILE && mobile === ADMIN_MOBILE ? '/admin' : '/dashboard');
    } catch {
      // ignore invalid/expired tokens
    }
  }

  return <HomeClient />;
}
