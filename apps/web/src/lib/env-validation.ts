/**
 * Environment Variable Validation
 * This file validates required environment variables at build time and runtime
 */

const requiredEnvVars = {
  // These are ONLY required for protected routes, not for public pages
  protected: [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'DATABASE_URL',
  ],
  // Optional variables that enhance functionality
  optional: [
    'OPENROUTER_API_KEY',
    'OPENROUTER_BASE_URL',
    'AI_MODEL',
    'OPENAI_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'STRIPE_CLIENT_SECRET', // deprecated: use STRIPE_SECRET_KEY
    'NEXT_PUBLIC_STRIPE_PUBLISH_KEY',
    'INSTAGRAM_EMBEDDED_OAUTH_URL',
  ],
};

export function validateEnv(route?: string) {
  // Only validate protected env vars for protected routes
  const isProtectedRoute = route?.startsWith('/dashboard') || 
                          route?.startsWith('/api/payment') || 
                          route?.startsWith('/callback');

  if (!isProtectedRoute) {
    // Public routes don't need env validation
    return { isValid: true, missing: [] };
  }

  const missing: string[] = [];

  requiredEnvVars.protected.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
      console.warn(`⚠️  Missing required environment variable: ${varName}`);
    }
  });

  // Log warnings for optional variables
  requiredEnvVars.optional.forEach((varName) => {
    if (!process.env[varName]) {
      console.info(`ℹ️  Optional environment variable not set: ${varName}`);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * The app uses Instagram Business Login (api.instagram.com token exchange),
 * so the OAuth dialog must be www.instagram.com/oauth/authorize. The
 * facebook.com/dialog/oauth endpoint rejects Instagram app IDs with
 * "Invalid app ID".
 */
export function validateInstagramOAuthUrl(url: string | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return `Instagram OAuth URL is not a valid URL: ${url}`;
  }
  if (parsed.hostname !== 'www.instagram.com' || !parsed.pathname.startsWith('/oauth/authorize')) {
    return `Instagram OAuth URL must be https://www.instagram.com/oauth/authorize (Instagram Business Login), got host "${parsed.hostname}${parsed.pathname}". facebook.com/dialog/oauth rejects Instagram app IDs.`;
  }
  if (!parsed.searchParams.get('client_id')) {
    return 'Instagram OAuth URL is missing the client_id parameter';
  }
  if (!parsed.searchParams.get('scope')) {
    return 'Instagram OAuth URL is missing the scope parameter (e.g. instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments)';
  }
  if (!parsed.searchParams.get('redirect_uri')) {
    return 'Instagram OAuth URL is missing the redirect_uri parameter';
  }
  if (parsed.searchParams.get('response_type') !== 'code') {
    return 'Instagram OAuth URL must use response_type=code';
  }

  const requiredScopes = new Set([
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
  ]);
  const scopes = new Set(
    (parsed.searchParams.get('scope') ?? '')
      .split(/[ ,]+/)
      .map((scope) => scope.trim())
      .filter(Boolean),
  );
  const missing = Array.from(requiredScopes).filter(
    (scope) => !scopes.has(scope),
  );
  const unexpected = Array.from(scopes).filter(
    (scope) => !requiredScopes.has(scope),
  );
  if (missing.length) {
    return `Instagram OAuth URL is missing required scopes: ${missing.join(', ')}`;
  }
  if (unexpected.length) {
    return `Instagram OAuth URL requests scopes the product does not use: ${unexpected.join(', ')}`;
  }
  return null;
}

type InstagramOAuthEnvironment = Readonly<Record<string, string | undefined>>;

/**
 * Resolve the server-controlled Instagram Business Login URL. Production can
 * provide the complete URL, but deriving it from the already-required app ID
 * and public host avoids a fragile duplicate environment variable.
 */
export function resolveInstagramOAuthUrl(
  environment: InstagramOAuthEnvironment = process.env,
): string | undefined {
  const configured = environment.INSTAGRAM_EMBEDDED_OAUTH_URL?.trim();
  if (configured) return configured;

  const clientId = (
    environment.INSTAGRAM_CLIENT_ID ??
    environment.NEXT_PUBLIC_INSTAGRAM_APP_ID
  )?.trim();
  const publicHost = environment.NEXT_PUBLIC_HOST_URL?.trim();
  if (!clientId || !publicHost) return undefined;

  let redirectUri: URL;
  try {
    redirectUri = new URL('/callback/instagram', publicHost);
  } catch {
    return undefined;
  }

  const oauthUrl = new URL('https://www.instagram.com/oauth/authorize');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri.toString());
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set(
    'scope',
    [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
    ].join(','),
  );
  return oauthUrl.toString();
}

export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  
  if (!value && !fallback) {
    console.warn(`Environment variable ${key} is not set and no fallback provided`);
    return '';
  }
  
  return value || fallback || '';
}

// Validate on module load (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Checking environment variables...');
  const { isValid, missing } = validateEnv('/dashboard'); // Test protected route validation
  
  if (!isValid) {
    console.warn('⚠️  Some required environment variables are missing for protected routes:');
    console.warn('Missing:', missing.join(', '));
    console.warn('Protected routes may not work properly without these variables.');
  } else {
    console.log('✅ All required environment variables are set');
  }

  for (const key of ['INSTAGRAM_EMBEDDED_OAUTH_URL']) {
    const problem = validateInstagramOAuthUrl(process.env[key]);
    if (problem) {
      console.warn(`⚠️  ${key}: ${problem}`);
    }
  }
}
