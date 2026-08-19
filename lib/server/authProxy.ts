import 'server-only';
import { NextResponse } from 'next/server';
import { forwardToBackend } from './backendApi';
import { setAuthenticationCookies } from './sessionCookies';

interface BackendAuthData {
  user: unknown;
  token: string;
}

interface BackendAuthResponse {
  success: boolean;
  message: string;
  data: BackendAuthData;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isBackendAuthResponse = (value: unknown): value is BackendAuthResponse => {
  if (!isRecord(value) || !isRecord(value.data)) {
    return false;
  }

  return (
    typeof value.success === 'boolean' &&
    typeof value.message === 'string' &&
    typeof value.data.token === 'string' &&
    isRecord(value.data.user)
  );
};

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return { error: true, message: 'Aura backend returned an invalid JSON response' };
  }
};

export const handleAuthenticationRequest = async (
  request: Request,
  endpoint: 'login' | 'register'
): Promise<Response> => {
  const backendResponse = await forwardToBackend(request, ['auth', endpoint]);
  const payload = await readJson(backendResponse);

  if (!backendResponse.ok) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  if (!isBackendAuthResponse(payload)) {
    return NextResponse.json(
      { error: true, message: 'Aura backend returned an invalid authentication response' },
      { status: 502 }
    );
  }

  await setAuthenticationCookies(payload.data.token);

  return NextResponse.json(
    {
      success: payload.success,
      message: payload.message,
      data: {
        user: payload.data.user,
      },
    },
    { status: backendResponse.status }
  );
};
