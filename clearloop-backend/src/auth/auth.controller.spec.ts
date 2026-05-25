import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    loginByEmail: jest.fn(),
    login: jest.fn(),
    validateOAuthUser: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================
  // POST /auth/register
  // =========================================================
  describe('register()', () => {
    it('should call authService.register with the dto', async () => {
      const dto = {
        companyName: 'Acme Corp',
        name: 'John Doe',
        email: 'john@acme.com',
        password: 'password123',
      };
      mockAuthService.register.mockResolvedValue({ access_token: 'token' });

      const result = await controller.register(dto as any);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ access_token: 'token' });
    });
  });

  // =========================================================
  // POST /auth/login - new endpoint in this PR
  // =========================================================
  describe('login()', () => {
    const dto = { email: 'john@acme.com', password: 'password123' };

    it('should call authService.loginByEmail with the dto', async () => {
      mockAuthService.loginByEmail.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(dto as any);

      expect(mockAuthService.loginByEmail).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ access_token: 'token' });
    });

    it('should forward workspace selection response', async () => {
      const workspaceResponse = {
        requiresWorkspaceSelection: true,
        workspaces: [
          { id: 'tenant-1', name: 'Acme Corp', slug: 'acme-corp' },
        ],
      };
      mockAuthService.loginByEmail.mockResolvedValue(workspaceResponse);

      const result = await controller.login(dto as any);

      expect(result).toEqual(workspaceResponse);
    });

    it('should not call loginBySlug (the legacy endpoint)', async () => {
      mockAuthService.loginByEmail.mockResolvedValue({ access_token: 'token' });

      await controller.login(dto as any);

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // POST /auth/login/:slug - renamed legacy endpoint
  // =========================================================
  describe('loginBySlug()', () => {
    const dto = { email: 'john@acme.com', password: 'password123' };
    const slug = 'acme-corp';

    it('should call authService.login with slug and dto', async () => {
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.loginBySlug(slug, dto as any);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto, slug);
      expect(result).toEqual({ access_token: 'token' });
    });

    it('should not call loginByEmail (the new endpoint)', async () => {
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      await controller.loginBySlug(slug, dto as any);

      expect(mockAuthService.loginByEmail).not.toHaveBeenCalled();
    });
  });
});