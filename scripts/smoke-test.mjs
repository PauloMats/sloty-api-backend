import { spawn } from 'node:child_process';

const port = 3100;
const baseUrl = `http://127.0.0.1:${port}/v1`;
const api = spawn(process.execPath, ['dist/main.js'], {
  env: {
    ...process.env,
    PORT: String(port),
    APP_URL: `http://127.0.0.1:${port}`,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let apiLogs = '';
api.stdout.on('data', (chunk) => {
  apiLogs += chunk.toString();
});
api.stderr.on('data', (chunk) => {
  apiLogs += chunk.toString();
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function containsKey(value, forbiddenKey) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(value, forbiddenKey)) {
    return true;
  }

  return Object.values(value).some((item) => containsKey(item, forbiddenKey));
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, body };
}

async function waitForApi() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const result = await request('/health/ready');
      if (result.response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`API did not become ready.\n${apiLogs}`);
}

async function run() {
  await waitForApi();

  const rejectedOrigin = await request('/health', {
    headers: { Origin: 'https://evil.example' },
  });
  assert(
    !rejectedOrigin.response.headers.get('access-control-allow-origin'),
    'Untrusted CORS origin was allowed.',
  );

  const trustedOrigin = await request('/health', {
    headers: { Origin: 'http://localhost:8081' },
  });
  assert(
    trustedOrigin.response.headers.get('access-control-allow-origin') ===
      'http://localhost:8081',
    'Trusted CORS origin was rejected.',
  );

  const clientLogin = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'client@sloty.local',
      password: 'Password123!',
    },
  });
  assert(clientLogin.response.ok, 'Seed client login failed.');
  const clientToken = clientLogin.body.tokens.accessToken;

  const businesses = await request('/businesses?city=Fortaleza');
  assert(
    businesses.response.ok && businesses.body.length > 0,
    'Public businesses failed.',
  );
  assert(
    !containsKey(businesses.body, 'ownerId'),
    'Public business leaked ownerId.',
  );
  assert(
    !containsKey(businesses.body, 'latitude'),
    'Public business leaked latitude.',
  );
  assert(
    !containsKey(businesses.body, 'longitude'),
    'Public business leaked longitude.',
  );

  const requests = await request('/service-requests/open?city=Fortaleza');
  assert(requests.response.ok, 'Public service requests failed.');
  for (const key of [
    'clientId',
    'addressId',
    'latitude',
    'longitude',
    'client',
  ]) {
    assert(
      !containsKey(requests.body, key),
      `Public service request leaked ${key}.`,
    );
  }

  const appointments = await request('/appointments/me', {
    token: clientToken,
  });
  assert(appointments.response.ok, 'Authenticated appointments failed.');
  assert(
    !containsKey(appointments.body, 'passwordHash'),
    'Appointment leaked passwordHash.',
  );

  const exportResult = await request('/users/me/export', {
    token: clientToken,
  });
  assert(exportResult.response.ok, 'LGPD data export failed.');
  assert(
    exportResult.body.user.email === 'client@sloty.local',
    'LGPD export returned wrong user.',
  );

  const unsignedWebhook = await request('/webhooks/stripe', {
    method: 'POST',
    body: { id: 'evt_unsigned', type: 'test' },
  });
  assert(
    [401, 503].includes(unsignedWebhook.response.status),
    'Unsigned Stripe webhook was accepted.',
  );

  const invalidUpload = await request('/uploads/presign', {
    method: 'POST',
    token: clientToken,
    body: {
      fileName: '../secret.txt',
      contentType: 'text/plain',
    },
  });
  assert(
    invalidUpload.response.status === 400,
    'Unsafe upload metadata was accepted.',
  );

  const smokeEmail = `smoke-${Date.now()}@sloty.local`;
  const registration = await request('/auth/register/client', {
    method: 'POST',
    body: {
      name: 'Smoke User',
      email: smokeEmail,
      password: 'SmokePass123!',
    },
  });
  assert(
    registration.response.status === 201,
    'Smoke user registration failed.',
  );
  const smokeToken = registration.body.tokens.accessToken;

  const deletion = await request('/users/me', {
    method: 'DELETE',
    token: smokeToken,
    body: { confirmation: 'DELETE' },
  });
  assert(deletion.response.ok, 'Account anonymization failed.');

  const inactiveAccess = await request('/auth/me', { token: smokeToken });
  assert(
    inactiveAccess.response.status === 401,
    'Anonymized account remained active.',
  );

  console.log('Security smoke test passed.');
}

try {
  await run();
} finally {
  api.kill('SIGTERM');
}
