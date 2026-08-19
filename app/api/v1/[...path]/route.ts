import { NextResponse } from 'next/server';
import { createProxyResponse, forwardToBackend } from '@/lib/server/backendApi';
import { hasValidCsrfRequest } from '@/lib/server/csrfValidation';
import { getSessionToken } from '@/lib/server/sessionCookies';

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

const isUnsafeMethod = (method: string): boolean => {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method);
};

const handleProxyRequest = async (
  request: Request,
  context: RouteContext
): Promise<Response> => {
  if (isUnsafeMethod(request.method) && !(await hasValidCsrfRequest(request))) {
    return NextResponse.json({ error: true, message: 'Invalid CSRF request' }, { status: 403 });
  }

  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: true, message: 'Authentication required' }, { status: 401 });
  }

  const { path } = await context.params;
  const backendResponse = await forwardToBackend(request, path, token);
  return createProxyResponse(backendResponse);
};

export const GET = handleProxyRequest;
export const POST = handleProxyRequest;
export const PUT = handleProxyRequest;
export const PATCH = handleProxyRequest;
export const DELETE = handleProxyRequest;
export const OPTIONS = handleProxyRequest;
