import {
  IsBooleanString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';
import { validateSync } from 'class-validator';

function extractSenderEmail(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const match = value.match(/<(.+)>/);
  return match?.[1] ?? value;
}

class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  PORT!: number;

  @IsUrl({ require_tld: false })
  APP_URL!: string;

  @IsUrl({ require_tld: false })
  FRONTEND_URL!: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRES!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsEmail(
    {},
    { message: 'RESEND_FROM_EMAIL must contain a valid sender email.' },
  )
  @Transform(({ value }: { value: unknown }) => extractSenderEmail(value))
  @IsOptional()
  RESEND_FROM_EMAIL?: string;

  @IsString()
  @IsOptional()
  RESEND_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_PRICE_ID_PRO?: string;

  @IsBooleanString()
  SWAGGER_ENABLED!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (validatedConfig.NODE_ENV === 'production') {
    const weakSecrets = [
      validatedConfig.JWT_ACCESS_SECRET,
      validatedConfig.JWT_REFRESH_SECRET,
    ].filter(
      (value) =>
        value.length < 32 ||
        value.startsWith('change-me') ||
        value.includes('secret'),
    );

    if (weakSecrets.length > 0) {
      throw new Error(
        'JWT secrets must be unique, random, and at least 32 characters in production.',
      );
    }

    if (
      validatedConfig.JWT_ACCESS_SECRET === validatedConfig.JWT_REFRESH_SECRET
    ) {
      throw new Error(
        'JWT access and refresh secrets must be different in production.',
      );
    }

    if (validatedConfig.SWAGGER_ENABLED === 'true') {
      throw new Error('SWAGGER_ENABLED must be false in production.');
    }

    if (!validatedConfig.CORS_ORIGINS?.trim()) {
      throw new Error('CORS_ORIGINS is required in production.');
    }

    if (
      !validatedConfig.APP_URL.startsWith('https://') ||
      !validatedConfig.FRONTEND_URL.startsWith('https://') ||
      validatedConfig.CORS_ORIGINS.split(',').some(
        (origin) => !origin.trim().startsWith('https://'),
      )
    ) {
      throw new Error('Production application and CORS URLs must use HTTPS.');
    }

    const stripeEnabled =
      validatedConfig.STRIPE_SECRET_KEY &&
      validatedConfig.STRIPE_SECRET_KEY !== 'sk_test_xxx';
    if (
      stripeEnabled &&
      (!validatedConfig.STRIPE_WEBHOOK_SECRET ||
        !validatedConfig.STRIPE_PRICE_ID_PRO)
    ) {
      throw new Error(
        'Stripe webhook secret and price ID are required when Stripe is enabled.',
      );
    }

    const resendEnabled =
      validatedConfig.RESEND_API_KEY &&
      validatedConfig.RESEND_API_KEY !== 're_test_key';
    if (
      resendEnabled &&
      (!validatedConfig.RESEND_FROM_EMAIL ||
        !validatedConfig.RESEND_WEBHOOK_SECRET)
    ) {
      throw new Error(
        'Resend sender email and webhook secret are required when Resend is enabled.',
      );
    }
  }

  return validatedConfig;
}
