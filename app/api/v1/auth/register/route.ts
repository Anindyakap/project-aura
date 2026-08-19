import { NextResponse } from 'next/server';
import { hasTrustedOrigin } from '@/lib/server/csrfValidation';
import { handleAuthenticationRequest } from '@/lib/server/authProxy';

export const POST = async (request: Request): Promise<Response> => {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: true, message: 'Invalid request origin' }, { status: 403 });
  }

  return handleAuthenticationRequest(request, 'register');
};
