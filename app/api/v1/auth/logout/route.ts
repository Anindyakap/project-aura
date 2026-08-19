import { NextResponse } from 'next/server';
import { hasValidCsrfRequest } from '@/lib/server/csrfValidation';
import { clearAuthenticationCookies } from '@/lib/server/sessionCookies';

export const POST = async (request: Request): Promise<Response> => {
  if (!(await hasValidCsrfRequest(request))) {
    return NextResponse.json({ error: true, message: 'Invalid CSRF request' }, { status: 403 });
  }

  await clearAuthenticationCookies();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
};
