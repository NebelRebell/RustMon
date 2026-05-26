import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { environment } from './environment';

function validateEnvironment() {
  const missing: string[] = [];
  if (!environment.steamApiKey) missing.push('STEAM_API');
  if (!environment.redis.host && !environment.redis.url) missing.push('CACHE_HOST (or CACHE_URL)');
  if (missing.length > 0) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════╗');
    console.error('║  RustAdmin Service - Missing required configuration  ║');
    console.error('╚══════════════════════════════════════════════════════╝');
    console.error('');
    console.error('The following environment variables are required but not set:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('');
    console.error('Example startup:');
    console.error('  STEAM_API=your-key CACHE_HOST=localhost CACHE_PORT=6379 npm run start:prod');
    console.error('');
    console.error('Or with Docker Compose: copy .env.example to .env and fill in the values.');
    console.error('');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnvironment();

  if (environment.APM.enabled) {
    const { initializeAPMAgent } = await import('@student-coin/elastic-apm-nest');
    initializeAPMAgent({
      serviceName: environment.APM.SERVICE_NAME,
      apiKey: environment.APM.API_KEY,
      serverUrl: environment.APM.SERVER_URL,
      logLevel: environment.APM.LOGGING,
    });
  }

  const app = await NestFactory.create(AppModule, { cors: true });

  if (environment.APM.enabled) {
    const { APM_MIDDLEWARE, ApmHttpUserContextInterceptor, ApmErrorInterceptor } = await import('@student-coin/elastic-apm-nest');
    const apmMiddleware = app.get(APM_MIDDLEWARE);
    app.useGlobalInterceptors(
      app.get(ApmHttpUserContextInterceptor),
      app.get(ApmErrorInterceptor),
    );
    app.use(apmMiddleware);
  }

  await app.listen(3000);
  console.log('RustAdmin Service running on port 3000');
}

bootstrap();
