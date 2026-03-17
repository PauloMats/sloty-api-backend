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

  @IsEmail({}, { message: 'RESEND_FROM_EMAIL must contain a valid sender email.' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const match = value.match(/<(.+)>/);
    return match?.[1] ?? value;
  })
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

  return validatedConfig;
}
