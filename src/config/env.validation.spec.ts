import 'reflect-metadata';
import { validateEnv } from './env.validation';

const productionEnv = {
  NODE_ENV: 'production',
  PORT: '3000',
  APP_URL: 'https://api.sloty.example',
  FRONTEND_URL: 'https://app.sloty.example',
  CORS_ORIGINS: 'https://app.sloty.example',
  JWT_ACCESS_SECRET: 'a'.repeat(48),
  JWT_REFRESH_SECRET: 'b'.repeat(48),
  JWT_ACCESS_EXPIRES: '15m',
  JWT_REFRESH_EXPIRES: '30d',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/sloty',
  REDIS_URL: 'redis://localhost:6379',
  SWAGGER_ENABLED: 'false',
};

describe('validateEnv', () => {
  it('accepts a hardened production configuration', () => {
    expect(() => validateEnv(productionEnv)).not.toThrow();
  });

  it('rejects weak production JWT secrets', () => {
    expect(() =>
      validateEnv({
        ...productionEnv,
        JWT_ACCESS_SECRET: 'short',
      }),
    ).toThrow('JWT secrets must be unique');
  });

  it('rejects Swagger in production', () => {
    expect(() =>
      validateEnv({
        ...productionEnv,
        SWAGGER_ENABLED: 'true',
      }),
    ).toThrow('SWAGGER_ENABLED must be false');
  });
});
