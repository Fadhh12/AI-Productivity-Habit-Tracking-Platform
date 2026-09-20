export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  ai: {
    provider: process.env.AI_PROVIDER ?? 'anthropic',
    claudeApiKey: process.env.CLAUDE_API_KEY,
    llmApiKey: process.env.LLM_API_KEY,
    llmBaseUrl: process.env.LLM_BASE_URL,
    model:
      process.env.AI_PROVIDER === 'openai'
        ? process.env.LLM_MODEL
        : (process.env.CLAUDE_MODEL ?? 'claude-sonnet-5'),
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '8000', 10),
    dailyRateLimit: parseInt(process.env.AI_DAILY_RATE_LIMIT ?? '50', 10),
    circuitBreakerThreshold: parseInt(process.env.AI_CIRCUIT_BREAKER_THRESHOLD ?? '5', 10),
    circuitBreakerCooldownMs: parseInt(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS ?? '60000', 10),
  },

  throttle: {
    ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },

  push: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com',
  },

  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',

  googleCalendar: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    tokenEncryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? process.env.JWT_ACCESS_SECRET,
  },
});
