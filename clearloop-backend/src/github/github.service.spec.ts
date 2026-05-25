import { Test, TestingModule } from '@nestjs/testing';
import { GithubService } from './github.service';
import { PrismaService } from '../prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('GithubService', () => {
  let service: GithubService;

  const mockPrisma = {
    project: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    pullRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    feature: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================
  // saveInstallation() - new in this PR
  // =========================================================
  describe('saveInstallation()', () => {
    it('should return installation message and id', async () => {
      const result = await service.saveInstallation('tenant-1', 'install-123');

      expect(result).toEqual({
        message: 'Installation saved',
        installationId: 'install-123',
      });
    });

    it('should log the save event', async () => {
      await service.saveInstallation('tenant-1', 'install-123');

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Installation install-123 saved for tenant tenant-1',
        'GithubService',
      );
    });
  });

  // =========================================================
  // getInstallation() - new in this PR
  // =========================================================
  describe('getInstallation()', () => {
    it('should return connected=false when no projects have installation', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await service.getInstallation('tenant-1');

      expect(result).toEqual({
        connected: false,
        installationId: null,
        projects: [],
      });
    });

    it('should return connected=true with installationId when projects exist', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'My Project',
          githubRepoUrl: 'https://github.com/org/repo',
          githubInstallationId: 'install-123',
        },
      ];
      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.getInstallation('tenant-1');

      expect(result).toEqual({
        connected: true,
        installationId: 'install-123',
        projects: mockProjects,
      });
    });

    it('should query projects filtered by tenantId and non-null installationId', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await service.getInstallation('tenant-abc');

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-abc',
          githubInstallationId: { not: null },
        },
        select: {
          id: true,
          name: true,
          githubRepoUrl: true,
          githubInstallationId: true,
        },
      });
    });

    it('should use installationId from first project when multiple projects exist', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project 1', githubRepoUrl: 'url1', githubInstallationId: 'install-111' },
        { id: 'proj-2', name: 'Project 2', githubRepoUrl: 'url2', githubInstallationId: 'install-111' },
      ];
      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.getInstallation('tenant-1');

      expect(result.installationId).toBe('install-111');
      expect(result.projects).toHaveLength(2);
    });
  });

  // =========================================================
  // disconnectInstallation() - new in this PR
  // =========================================================
  describe('disconnectInstallation()', () => {
    it('should clear githubInstallationId and githubRepoId from all tenant projects', async () => {
      mockPrisma.project.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.disconnectInstallation('tenant-1');

      expect(mockPrisma.project.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        data: {
          githubInstallationId: null,
          githubRepoId: null,
        },
      });
      expect(result).toEqual({ message: 'GitHub App disconnected successfully' });
    });

    it('should succeed even when no projects need updating', async () => {
      mockPrisma.project.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.disconnectInstallation('tenant-1');

      expect(result).toEqual({ message: 'GitHub App disconnected successfully' });
    });
  });

  // =========================================================
  // handleInstallationEvent() - new in this PR
  // =========================================================
  describe('handleInstallationEvent()', () => {
    const baseInstallation = {
      id: 12345,
      repositories: [],
    };

    describe('action: created', () => {
      it('should return installation processed message', async () => {
        const payload = {
          action: 'created',
          installation: baseInstallation,
          repositories: [],
        };

        const result = await service.handleInstallationEvent(payload);

        expect(result).toEqual({ message: 'Installation processed successfully' });
      });

      it('should update matching project with installation_id and repo_id', async () => {
        const mockProject = {
          id: 'proj-1',
          name: 'My Project',
          tenantId: 'tenant-1',
        };
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.project.update.mockResolvedValue({});

        const payload = {
          action: 'created',
          installation: { id: 12345, repositories: [] },
          repositories: [
            { id: 111, html_url: 'https://github.com/org/repo' },
          ],
        };

        await service.handleInstallationEvent(payload);

        expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
          where: { githubRepoUrl: 'https://github.com/org/repo' },
        });
        expect(mockPrisma.project.update).toHaveBeenCalledWith({
          where: { id: 'proj-1' },
          data: {
            githubInstallationId: '12345',
            githubRepoId: '111',
          },
        });
      });

      it('should warn when no project found for a repo url', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);

        const payload = {
          action: 'created',
          installation: { id: 12345 },
          repositories: [
            { id: 111, html_url: 'https://github.com/org/unknown-repo' },
          ],
        };

        await service.handleInstallationEvent(payload);

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'No project found for repo: https://github.com/org/unknown-repo',
          'GithubService',
        );
      });

      it('should fall back to installation.repositories when repositories is missing', async () => {
        const payload = {
          action: 'created',
          installation: {
            id: 12345,
            repositories: [
              { id: 222, html_url: 'https://github.com/org/repo2' },
            ],
          },
          // no top-level repositories key
        };
        mockPrisma.project.findFirst.mockResolvedValue(null);

        await service.handleInstallationEvent(payload);

        expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
          where: { githubRepoUrl: 'https://github.com/org/repo2' },
        });
      });
    });

    describe('action: added', () => {
      it('should process added action same as created', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);

        const payload = {
          action: 'added',
          installation: { id: 12345 },
          repositories: [
            { id: 111, html_url: 'https://github.com/org/repo' },
          ],
        };

        const result = await service.handleInstallationEvent(payload);

        expect(result).toEqual({ message: 'Installation processed successfully' });
        expect(mockPrisma.project.findFirst).toHaveBeenCalled();
      });
    });

    describe('action: deleted', () => {
      it('should clear githubInstallationId and githubRepoId from all linked projects', async () => {
        mockPrisma.project.updateMany.mockResolvedValue({ count: 2 });

        const payload = {
          action: 'deleted',
          installation: { id: 12345 },
        };

        const result = await service.handleInstallationEvent(payload);

        expect(mockPrisma.project.updateMany).toHaveBeenCalledWith({
          where: { githubInstallationId: '12345' },
          data: {
            githubInstallationId: null,
            githubRepoId: null,
          },
        });
        expect(result).toEqual({ message: 'Installation removed successfully' });
      });
    });

    describe('action: unknown', () => {
      it('should return generic processed message for unknown actions', async () => {
        const payload = {
          action: 'suspend',
          installation: { id: 12345 },
        };

        const result = await service.handleInstallationEvent(payload);

        expect(result).toEqual({ message: 'Installation event suspend processed' });
      });
    });

    it('should log installation events', async () => {
      const payload = {
        action: 'created',
        installation: { id: 99999 },
        repositories: [],
      };

      await service.handleInstallationEvent(payload);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Installation event: created, installation_id: 99999',
        'GithubService',
      );
    });
  });

  // =========================================================
  // handleWebhook() - modified to use logger instead of console.log
  // =========================================================
  describe('handleWebhook()', () => {
    it('should throw BadRequestException for missing pull_request', async () => {
      const payload = {
        action: 'opened',
        pull_request: null,
        repository: { id: 1, full_name: 'org/repo' },
      } as any;

      await expect(service.handleWebhook(payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing repository', async () => {
      const payload = {
        action: 'opened',
        pull_request: { id: 1, head: { ref: 'main' }, body: null },
        repository: null,
      } as any;

      await expect(service.handleWebhook(payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use logger.warn (not console.log) when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const payload = {
        action: 'opened',
        pull_request: {
          id: 1,
          number: 42,
          head: { ref: 'feature/test' },
          body: null,
          html_url: 'https://github.com/org/repo/pull/42',
          title: 'Test PR',
          user: { login: 'dev' },
          created_at: new Date().toISOString(),
        },
        repository: {
          id: 999,
          full_name: 'org/unknown-repo',
          html_url: 'https://github.com/org/repo',
        },
      } as any;

      const result = await service.handleWebhook(payload);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No Project found for repo: org/unknown-repo',
        'GithubService',
      );
      expect(result).toEqual({ message: 'Repository not linked to any project' });
    });

    it('should log webhook action when project found', async () => {
      const mockProject = {
        id: 'proj-1',
        tenantId: 'tenant-1',
        tenant: { id: 'tenant-1', name: 'Acme' },
      };
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);

      // Mock transaction for PR opened
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        mockPrisma.pullRequest.findFirst.mockResolvedValue(null);
        mockPrisma.pullRequest.create.mockResolvedValue({ id: 'pr-1' });
        return cb({
          pullRequest: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'pr-1' }),
          },
          feature: {
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
          activityLog: { create: jest.fn() },
        });
      });

      const payload = {
        action: 'opened',
        pull_request: {
          id: 1,
          number: 7,
          head: { ref: 'feature/no-match' },
          body: null,
          html_url: 'https://github.com/org/repo/pull/7',
          title: 'Add feature',
          user: { login: 'dev' },
          created_at: new Date().toISOString(),
        },
        repository: {
          id: 999,
          full_name: 'org/repo',
          html_url: 'https://github.com/org/repo',
        },
      } as any;

      await service.handleWebhook(payload);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Webhook: opened PR #7'),
        'GithubService',
      );
    });
  });
});