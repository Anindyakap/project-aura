import 'server-only';

const getBackendApiUrl = (): string => {
  const backendApiUrl = process.env.BACKEND_API_URL;

  if (!backendApiUrl) {
    throw new Error('BACKEND_API_URL must be set for the Aura frontend server');
  }

  return backendApiUrl.replace(/\/$/, '');
};

export const createBackendApiUrl = (
  pathSegments: string[],
  search: string
): URL => {
  const encodedPath = pathSegments.map(encodeURIComponent).join('/');
  const backendUrl = new URL(`${getBackendApiUrl()}/${encodedPath}`);
  backendUrl.search = search;
  return backendUrl;
};

export const forwardToBackend = async (
  request: Request,
  pathSegments: string[],
  token?: string
): Promise<Response> => {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');

  if (contentType) {
    headers.set('content-type', contentType);
  }

  if (accept) {
    headers.set('accept', accept);
  }

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const methodAllowsBody = !['GET', 'HEAD'].includes(request.method);
  const body = methodAllowsBody ? await request.text() : undefined;

  return fetch(createBackendApiUrl(pathSegments, new URL(request.url).search), {
    method: request.method,
    headers,
    body: body || undefined,
    cache: 'no-store',
    redirect: 'manual',
  });
};

export const createProxyResponse = (backendResponse: Response): Response => {
  const headers = new Headers();
  const contentType = backendResponse.headers.get('content-type');
  const requestId = backendResponse.headers.get('x-request-id');
  const location = backendResponse.headers.get('location');

  if (contentType) {
    headers.set('content-type', contentType);
  }

  if (requestId) {
    headers.set('x-request-id', requestId);
  }

  if (location) {
    headers.set('location', location);
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
};
