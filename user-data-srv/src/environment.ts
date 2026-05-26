export const environment = {
  steamApiKey: process.env.STEAM_API || '',
  ipstackApiKey: '',
  redis: {
    url: process.env.CACHE_URL || undefined,
    host: process.env.CACHE_HOST || 'localhost',
    auth_pass: process.env.CACHE_AUTH || '',
    port: process.env.CACHE_PORT ? parseInt(process.env.CACHE_PORT) : 6379
  },
  APM: {
    enabled: process.env.APM_ENABLED?.toLowerCase() === 'yes',
    SERVICE_NAME: process.env.APM_SERVICE_NAME || 'rustadmin-service',
    SERVER_URL: process.env.APM_SERVER_URL || 'http://localhost:8200',
    API_KEY: process.env.APM_API_KEY || '',
    LOGGING: (process.env.APM_LOGGING || 'off') as any,
  },
  secondsCacheUsers: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 604800,
}
