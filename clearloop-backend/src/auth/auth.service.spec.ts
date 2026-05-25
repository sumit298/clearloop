import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt to avoid slow hashing in tests
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================
  // register()
  // =========================================================
  describe('register()', () => {
    const dto = {
      companyName: 'Acme Corp',
      name: 'John Doe',
      email: 'john@acme.com',
      password: 'password123',
    };

    const mockTenant = {
      id: 'tenant-1',
      name: 'Acme Corp',
      slug: 'acme-corp-abc123',
      users: [
        {
          id: 'user-1',
          email: 'john@acme.com',
          name: 'John Doe',
          role: 'ADMIN',
          tenantId: 'tenant-1',
        },
      ],
    };

    it('should auto-generate slug from company name', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(dto);

      expect(result).toEqual({ access_token: 'mock-token' });
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Acme Corp',
            slug: expect.stringMatching(/^acme-corp-[a-z0-9]+$/),
          }),
        }),
      );
    });

    it('should sanitize special characters in slug', async () => {
      const dtoWithSpecialChars = { ...dto, companyName: 'Hello & World! LLC' };
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.register(dtoWithSpecialChars);

      const createCall = mockPrisma.tenant.create.mock.calls[0][0];
      expect(createCall.data.slug).toMatch(/^hello-world-llc-[a-z0-9]+$/);
    });

    it('should truncate long company names to 30 chars in base slug', async () => {
      const longName = 'A'.repeat(50);
      const longDto = { ...dto, companyName: longName };
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.register(longDto);

      const createCall = mockPrisma.tenant.create.mock.calls[0][0];
      // base slug is 30 chars + '-' + 6 char suffix = at most 37 chars
      expect(createCall.data.slug.length).toBeLessThanOrEqual(37);
    });

    it('should retry with different suffix on slug collision', async () => {
      // First findUnique returns existing (collision), then create succeeds
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({ id: 'existing' });
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(dto);

      expect(result).toEqual({ access_token: 'mock-token' });
      // When collision, it still calls create with a new slug
      expect(mockPrisma.tenant.create).toHaveBeenCalledTimes(1);
    });

    it('should hash the password before storing', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.register(dto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      const createCall = mockPrisma.tenant.create.mock.calls[0][0];
      expect(createCall.data.users.create.password).toBe('hashed-password');
    });

    it('should create admin user in tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.register(dto);

      const createCall = mockPrisma.tenant.create.mock.calls[0][0];
      expect(createCall.data.users.create).toMatchObject({
        email: 'john@acme.com',
        name: 'John Doe',
        role: 'ADMIN',
      });
    });

    it('should throw InternalServerErrorException if user creation fails', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      // Return tenant with no users
      mockPrisma.tenant.create.mockResolvedValue({ ...mockTenant, users: [] });
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await expect(service.register(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should return access_token on successful registration', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(dto);

      expect(result).toHaveProperty('access_token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        tenantId: 'tenant-1',
        role: 'ADMIN',
      });
    });
  });

  // =========================================================
  // loginByEmail() - new in this PR
  // =========================================================
  describe('loginByEmail()', () => {
    const dto = { email: 'john@acme.com', password: 'password123' };

    const mockUser = {
      id: 'user-1',
      email: 'john@acme.com',
      password: 'hashed-password',
      role: 'ADMIN',
      tenantId: 'tenant-1',
      tenant: { id: 'tenant-1', name: 'Acme Corp', slug: 'acme-corp' },
    };

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await expect(service.loginByEmail(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is null', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { ...mockUser, password: null },
      ]);

      await expect(service.loginByEmail(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.loginByEmail(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return access_token for single workspace', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.loginByEmail(dto);

      expect(result).toHaveProperty('access_token', 'mock-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        tenantId: 'tenant-1',
        role: 'ADMIN',
      });
    });

    it('should return workspace selection list when user has multiple workspaces', async () => {
      const secondUser = {
        ...mockUser,
        id: 'user-2',
        tenantId: 'tenant-2',
        tenant: { id: 'tenant-2', name: 'Beta Corp', slug: 'beta-corp' },
      };
      mockPrisma.user.findMany.mockResolvedValue([mockUser, secondUser]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.loginByEmail(dto);

      expect(result).toEqual({
        requiresWorkspaceSelection: true,
        workspaces: [
          { id: 'tenant-1', name: 'Acme Corp', slug: 'acme-corp' },
          { id: 'tenant-2', name: 'Beta Corp', slug: 'beta-corp' },
        ],
      });
    });

    it('should not sign token when multiple workspaces require selection', async () => {
      const secondUser = {
        ...mockUser,
        id: 'user-2',
        tenantId: 'tenant-2',
        tenant: { id: 'tenant-2', name: 'Beta Corp', slug: 'beta-corp' },
      };
      mockPrisma.user.findMany.mockResolvedValue([mockUser, secondUser]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.loginByEmail(dto);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should search users by email across all tenants', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.loginByEmail(dto);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { email: 'john@acme.com' },
        include: { tenant: true },
      });
    });
  });

  // =========================================================
  // login() - legacy slug-based login (unchanged but tested for regression)
  // =========================================================
  describe('login() - legacy slug-based', () => {
    const dto = { email: 'john@acme.com', password: 'password123' };
    const slug = 'acme-corp';

    const mockTenant = { id: 'tenant-1', name: 'Acme Corp', slug };
    const mockUser = {
      id: 'user-1',
      email: 'john@acme.com',
      password: 'hashed-password',
      role: 'ADMIN',
      tenantId: 'tenant-1',
    };

    it('should throw UnauthorizedException when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.login(dto, slug)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found in tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto, slug)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto, slug)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return access_token on valid credentials', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto, slug);

      expect(result).toHaveProperty('access_token', 'mock-token');
    });
  });
});