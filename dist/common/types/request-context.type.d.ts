import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from './authenticated-user.type';
export type AuthenticatedRequest = FastifyRequest & {
    user: AuthenticatedUser;
    rawBody?: Buffer | string;
};
