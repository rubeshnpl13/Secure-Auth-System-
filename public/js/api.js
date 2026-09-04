let accessToken = null;

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');

  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(body?.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return body;
}

export async function signup(email, password) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  accessToken = data.accessToken;
  return data;
}

export async function refreshAccessToken() {
  const data = await request('/api/auth/refresh', {
    method: 'POST',
  });

  accessToken = data.accessToken;
  return data;
}

export async function getCurrentUser() {
  if (!accessToken) {
    await refreshAccessToken();
  }

  return request('/api/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function logout() {
  try {
    await request('/api/auth/logout', {
      method: 'POST',
    });
  } finally {
    accessToken = null;
  }
}
