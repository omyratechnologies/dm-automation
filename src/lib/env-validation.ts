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
    'OPENAI_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'STRIPE_CLIENT_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISH_KEY',
    'INSTAGRAM_APP_ID',
    'INSTAGRAM_APP_SECRET',
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
}
