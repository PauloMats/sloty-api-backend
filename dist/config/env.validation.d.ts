declare class EnvironmentVariables {
    NODE_ENV: string;
    PORT: number;
    APP_URL: string;
    FRONTEND_URL: string;
    CORS_ORIGINS?: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES: string;
    JWT_REFRESH_EXPIRES: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
    RESEND_WEBHOOK_SECRET?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_PRICE_ID_PRO?: string;
    SWAGGER_ENABLED: string;
}
export declare function validateEnv(config: Record<string, unknown>): EnvironmentVariables;
export {};
