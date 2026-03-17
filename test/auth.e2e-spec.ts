import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { createTestApp } from './test-app.factory';

describe('AuthController (e2e)', () => {
  it('registers a client account', async () => {
    const authService = {
      registerClient: jest.fn().mockResolvedValue({
        user: {
          id: 'user_1',
          email: 'ana@example.com',
        },
        tokens: {
          accessToken: 'access',
          refreshToken: 'refresh',
        },
      }),
    };

    const app = await createTestApp({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    await request(app.getHttpServer())
      .post('/v1/auth/register/client')
      .send({
        name: 'Ana Costa',
        email: 'ana@example.com',
        password: 'StrongPass123!',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.user.id).toBe('user_1');
        expect(body.tokens.accessToken).toBe('access');
      });

    await app.close();
  });
});
