import { Test, TestingModule } from '@nestjs/testing';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { BadRequestException } from '@nestjs/common';

describe('GithubController', () => {
  let controller: GithubController;

  const mockGithubService = {
    saveInstallation: jest.fn(),
    getInstallation: jest.fn(),
    disconnectInstallation: jest.fn(),
    handleInstallationEvent: jest.fn(),
    handleWebhook: jest.fn(),
    listPullRequests: jest.fn(),
    getPullRequest: jest.fn(),
    linkPRToFeature: jest.fn(),
    unlinkPRFromFeature: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset env vars
    delete process.env.GITHUB_APP_CLIENT_ID;
    delete process.env.GITHUB_APP_NAME;
    delete process.env.GITHUB_WEBHOOK_SECRET;
    delete process.env.FRONTEND_URL;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [
        { provide: GithubService, useValue: mockGithubService },
      ],
    })
      // Override guards to avoid JWT/tenant validation in unit tests
      .overrideGuard(require('../auth/guards/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../common/guards/tenant.guard').TenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../auth/guards/roles.guard').RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GithubController>(GithubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================
  // GET /github/install-url - new in this PR
  // =========================================================
  describe('getInstallUrl()', () => {
    it('should throw BadRequestException when GITHUB_APP_CLIENT_ID is not set', async () => {
      const req = { tenantId: 'tenant-1' } as any;

      await expect(controller.getInstallUrl(req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return install URL when env vars are set', async () => {
      process.env.GITHUB_APP_CLIENT_ID = 'some-client-id';
      process.env.GITHUB_APP_NAME = 'my-github-app';

      const req = { tenantId: 'tenant-1' } as any;
      const result = await controller.getInstallUrl(req);

      expect(result).toHaveProperty('url');
      expect(result.url).toContain('https://github.com/apps/my-github-app/installations/new');
    });

    it('should encode tenantId in the state query param', async () => {
      process.env.GITHUB_APP_CLIENT_ID = 'client-id';
      process.env.GITHUB_APP_NAME = 'my-app';

      const req = { tenantId: 'tenant-abc-123' } as any;
      const result = await controller.getInstallUrl(req);

      const url = new URL(result.url);
      const state = url.searchParams.get('state');
      expect(state).toBeTruthy();

      const decoded = JSON.parse(Buffer.from(state!, 'base64').toString());
      expect(decoded).toEqual({ tenantId: 'tenant-abc-123' });
    });
  });

  // =========================================================
  // GET /github/install/callback - new in this PR
  // =========================================================
  describe('installationCallback()', () => {
    it('should call saveInstallation and redirect to settings with github=connected', async () => {
      process.env.FRONTEND_URL = 'https://app.example.com';
      mockGithubService.saveInstallation.mockResolvedValue({ message: 'Installation saved' });

      const tenantId = 'tenant-1';
      const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
      const res = { redirect: jest.fn() };

      await controller.installationCallback('install-456', 'install', state, res as any);

      expect(mockGithubService.saveInstallation).toHaveBeenCalledWith('tenant-1', 'install-456');
      expect(res.redirect).toHaveBeenCalledWith(
        'https://app.example.com/dashboard/settings?github=connected',
      );
    });

    it('should redirect with github=error when state decode fails', async () => {
      process.env.FRONTEND_URL = 'https://app.example.com';

      const res = { redirect: jest.fn() };
      const invalidState = 'not-valid-base64-json!!!';

      await controller.installationCallback('install-456', 'install', invalidState, res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://app.example.com/dashboard/settings?github=error',
      );
    });

    it('should redirect with github=error when saveInstallation throws', async () => {
      process.env.FRONTEND_URL = 'https://app.example.com';
      mockGithubService.saveInstallation.mockRejectedValue(new Error('DB error'));

      const state = Buffer.from(JSON.stringify({ tenantId: 'tenant-1' })).toString('base64');
      const res = { redirect: jest.fn() };

      await controller.installationCallback('install-456', 'install', state, res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://app.example.com/dashboard/settings?github=error',
      );
    });

    it('should use default localhost FRONTEND_URL when env var not set', async () => {
      delete process.env.FRONTEND_URL;
      mockGithubService.saveInstallation.mockResolvedValue({});

      const state = Buffer.from(JSON.stringify({ tenantId: 'tenant-1' })).toString('base64');
      const res = { redirect: jest.fn() };

      await controller.installationCallback('install-456', 'install', state, res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/dashboard/settings?github=connected',
      );
    });
  });

  // =========================================================
  // GET /github/installation - new in this PR
  // =========================================================
  describe('getInstallation()', () => {
    it('should call githubService.getInstallation with tenantId', async () => {
      const mockResult = { connected: true, installationId: 'install-123', projects: [] };
      mockGithubService.getInstallation.mockResolvedValue(mockResult);

      const req = { tenantId: 'tenant-1' } as any;
      const result = await controller.getInstallation(req);

      expect(mockGithubService.getInstallation).toHaveBeenCalledWith('tenant-1');
      expect(result).toEqual(mockResult);
    });
  });

  // =========================================================
  // DELETE /github/installation - new in this PR
  // =========================================================
  describe('disconnectInstallation()', () => {
    it('should call githubService.disconnectInstallation with tenantId', async () => {
      mockGithubService.disconnectInstallation.mockResolvedValue({
        message: 'GitHub App disconnected successfully',
      });

      const req = { tenantId: 'tenant-1' } as any;
      const result = await controller.disconnectInstallation(req);

      expect(mockGithubService.disconnectInstallation).toHaveBeenCalledWith('tenant-1');
      expect(result).toEqual({ message: 'GitHub App disconnected successfully' });
    });
  });

  // =========================================================
  // POST /github/webhook - extended to handle installation events
  // =========================================================
  describe('handleWebHook()', () => {
    const makeReq = (rawBody?: Buffer) => ({ rawBody } as any);

    it('should handle installation event', async () => {
      mockGithubService.handleInstallationEvent.mockResolvedValue({
        message: 'Installation processed successfully',
      });

      const result = await controller.handleWebHook(
        makeReq(),
        { action: 'created', installation: { id: 1 } },
        '',
        'installation',
      );

      expect(mockGithubService.handleInstallationEvent).toHaveBeenCalledWith(
        { action: 'created', installation: { id: 1 } },
      );
      expect(result).toEqual({ message: 'Installation processed successfully' });
    });

    it('should handle installation_repositories event', async () => {
      mockGithubService.handleInstallationEvent.mockResolvedValue({
        message: 'Installation processed successfully',
      });

      const result = await controller.handleWebHook(
        makeReq(),
        { action: 'added' },
        '',
        'installation_repositories',
      );

      expect(mockGithubService.handleInstallationEvent).toHaveBeenCalled();
    });

    it('should return ignored message for non-pull_request, non-installation events', async () => {
      const result = await controller.handleWebHook(
        makeReq(),
        {},
        '',
        'push',
      );

      expect(result).toEqual({ message: 'Event push ignored' });
      expect(mockGithubService.handleWebhook).not.toHaveBeenCalled();
      expect(mockGithubService.handleInstallationEvent).not.toHaveBeenCalled();
    });

    it('should call handleWebhook for pull_request events', async () => {
      mockGithubService.handleWebhook.mockResolvedValue({ message: 'PR created' });

      const payload = { action: 'opened' };
      const result = await controller.handleWebHook(
        makeReq(),
        payload,
        '',
        'pull_request',
      );

      expect(mockGithubService.handleWebhook).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ message: 'PR created' });
    });

    it('should skip signature verification when GITHUB_WEBHOOK_SECRET is not set', async () => {
      delete process.env.GITHUB_WEBHOOK_SECRET;
      mockGithubService.handleInstallationEvent.mockResolvedValue({});

      // Should not throw even with no signature
      await expect(
        controller.handleWebHook(makeReq(), {}, '', 'installation'),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException for invalid webhook signature when secret is set', async () => {
      process.env.GITHUB_WEBHOOK_SECRET = 'my-secret';

      const rawBody = Buffer.from(JSON.stringify({ action: 'opened' }));
      const req = { rawBody } as any;

      await expect(
        controller.handleWebHook(req, {}, 'sha256=invalid', 'pull_request'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});