import { ComputeProvider } from '@metallichq/providers';
import {
  ComputerService,
  DEFAULT_AUTO_DESTROY,
  DEFAULT_TEMPLATE_SLUG,
  generateId,
  getLogger,
  HttpError,
  nowUnix,
  Resource,
  TemplateService,
  unixToISOString
} from '@metallichq/shared';
import {
  ComputerDestroyedObject,
  ComputerObject,
  ComputerStateSchema,
  PaginationParametersSchema,
  Template
} from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ComputerHook } from '../hooks/index.js';
import { ResponseLocalsSchema } from '../utils/locals.js';
import { getProjectIdFromLocals } from '../utils/project.js';
import { validateRegion, validateTtlSeconds } from '../utils/validators.js';

const logger = getLogger('ComputerController');

const ListComputersRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema,
  query: PaginationParametersSchema.extend({
    template: z.string().optional(),
    region: z.string().optional(),
    state: ComputerStateSchema.optional()
  })
});

export const listComputers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListComputersRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      query: req.query
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const { computers, cursorFirst, cursorLast, hasMore } = await ComputerService.getComputersByProjectId(projectId, {
      ...parsedReq.data.query
    });

    const computerObjects: ComputerObject[] = computers.map((computer) => {
      return {
        object: 'computer',
        id: computer.id,
        project_id: computer.project_id,
        template: computer.template_slug,
        instance_id: computer.provider_id,
        region: computer.region,
        state: computer.state,
        ttl_seconds: computer.ttl_seconds,
        auto_destroy: computer.auto_destroy,
        metadata: computer.metadata,
        created_at: computer.created_at,
        updated_at: computer.updated_at
      };
    });

    res.status(200).json({
      object: 'list',
      data: computerObjects,
      first: cursorFirst,
      last: cursorLast,
      has_more: hasMore
    });
  } catch (err) {
    next(err);
  }
};

const CountComputersRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema
});

export const countComputers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = CountComputersRequestSchema.safeParse({
      method: req.method,
      locals: res.locals
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const count = await ComputerService.countComputersByProjectId(projectId);
    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
};

const CreateComputerRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({
    template: z.string().optional(),
    region: z.string().optional(),
    ttl_seconds: z.number().nullable().optional(),
    auto_destroy: z.boolean().optional(),
    env: z.record(z.string(), z.string()).optional(),
    metadata: z.record(z.string(), z.string()).optional()
  })
});

export const createComputer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = CreateComputerRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const { body } = parsedReq.data;

    let template: Template;
    if (body.template) {
      const existingTemplate = await TemplateService.getTemplateBySlug(body.template);
      if (!existingTemplate) {
        throw HttpError.badRequest(`Template "${body.template}" not found`);
      } else if (existingTemplate.project_id !== null && existingTemplate.project_id !== projectId) {
        throw HttpError.badRequest(`You do not have permission to use template "${body.template}"`);
      }

      template = existingTemplate;
    } else {
      const defaultTemplate = await TemplateService.getTemplateBySlug(DEFAULT_TEMPLATE_SLUG);
      if (!defaultTemplate) {
        throw new Error('Failed to retrieve default template');
      }

      template = defaultTemplate;
    }

    const region = validateRegion(body.region);
    const ttlSeconds = validateTtlSeconds(body.ttl_seconds);
    const autoDestroy = body.auto_destroy ?? DEFAULT_AUTO_DESTROY;
    const metadata = body.metadata ?? null;

    logger.info(`Creating computer...`);

    const t0 = nowUnix();
    const computerId = generateId(Resource.Computer);
    const providerComputer = await ComputeProvider.createComputer({
      project_id: projectId,
      computer_id: computerId,
      instance_type: template.instance_type,
      storage_gb: template.storage_gb,
      region,
      ttl_seconds: ttlSeconds,
      image: template.image,
      init: template.init ?? undefined,
      env: body.env,
      metadata: body.metadata
    });

    const t1 = nowUnix();
    const computer = await ComputerService.createComputer({
      id: computerId,
      project_id: projectId,
      template_slug: template.slug,
      region: providerComputer.region,
      provider: providerComputer.provider,
      provider_id: providerComputer.provider_computer_id,
      state: 'starting',
      ttl_seconds: ttlSeconds,
      auto_destroy: autoDestroy,
      metadata: metadata ?? null,
      created_at: unixToISOString(t0),
      updated_at: unixToISOString(t1)
    });

    await ComputerService.createComputerEvents([
      { computer_id: computer.id, type: 'created', timestamp: t0, metadata: null },
      { computer_id: computer.id, type: 'starting', timestamp: t1, metadata: null }
    ]);

    ComputerHook.syncState({
      projectId,
      computerId: computer.id,
      providerComputerId: providerComputer.provider_computer_id,
      currentState: 'starting',
      expectedState: 'started'
    });

    logger.info(`Computer created! ID: ${computer.id}, State: ${computer.state}`);

    const computerObject: ComputerObject = {
      object: 'computer',
      id: computer.id,
      project_id: computer.project_id,
      template: computer.template_slug,
      instance_id: computer.provider_id,
      region: computer.region,
      state: computer.state,
      ttl_seconds: computer.ttl_seconds,
      auto_destroy: computer.auto_destroy,
      metadata: computer.metadata,
      created_at: computer.created_at,
      updated_at: computer.updated_at
    };

    res.status(201).json(computerObject);
  } catch (err) {
    next(err);
  }
};

const RetrieveComputerRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema,
  params: z.object({ computer_id: z.string() })
});

export const retrieveComputer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = RetrieveComputerRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    const computerObject: ComputerObject = {
      object: 'computer',
      id: computer.id,
      project_id: computer.project_id,
      template: computer.template_slug,
      instance_id: computer.provider_id,
      state: computer.state,
      region: computer.region,
      ttl_seconds: computer.ttl_seconds,
      auto_destroy: computer.auto_destroy,
      metadata: computer.metadata,
      created_at: computer.created_at,
      updated_at: computer.updated_at
    };

    res.status(200).json(computerObject);
  } catch (err) {
    next(err);
  }
};

const UpdateComputerRequestSchema = z.object({
  method: z.literal('PUT'),
  locals: ResponseLocalsSchema,
  params: z.object({ computer_id: z.string() }),
  body: z.object({
    ttl_seconds: z.number().nullable().optional(),
    auto_destroy: z.boolean().optional(),
    metadata: z.record(z.string(), z.string()).optional()
  })
});

export const updateComputer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = UpdateComputerRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    logger.info(`Updating computer...`);

    let { ttl_seconds: ttlSeconds, auto_destroy: autoDestroy, metadata } = parsedReq.data.body;

    const updatedComputer = await ComputerService.updateComputer(computer_id, {
      ttl_seconds: ttlSeconds ? validateTtlSeconds(ttlSeconds) : undefined,
      auto_destroy: autoDestroy ?? computer.auto_destroy,
      metadata: metadata || undefined
    });

    logger.info(`Computer updated! ID: ${updatedComputer.id}, State: ${updatedComputer.state}`);

    const computerObject: ComputerObject = {
      object: 'computer',
      id: updatedComputer.id,
      project_id: updatedComputer.project_id,
      template: updatedComputer.template_slug,
      instance_id: updatedComputer.provider_id,
      state: updatedComputer.state,
      region: updatedComputer.region,
      ttl_seconds: updatedComputer.ttl_seconds,
      auto_destroy: updatedComputer.auto_destroy,
      metadata: updatedComputer.metadata,
      created_at: updatedComputer.created_at,
      updated_at: updatedComputer.updated_at
    };

    res.status(200).json(computerObject);
  } catch (err) {
    next(err);
  }
};

const DestroyComputerRequestSchema = z.object({
  method: z.literal('DELETE'),
  locals: ResponseLocalsSchema,
  params: z.object({ computer_id: z.string() })
});

export const destroyComputer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = DestroyComputerRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    await ComputerService.createComputerEvent({
      computer_id: computer.id,
      type: 'destroying',
      timestamp: nowUnix(),
      metadata: null
    });

    await ComputeProvider.destroyComputer({
      project_id: computer.project_id,
      provider_computer_id: computer.provider_id
    });

    await ComputerService.createComputerEvent({
      computer_id: computer.id,
      type: 'destroyed',
      timestamp: nowUnix(),
      metadata: null
    });

    await ComputerService.destroyComputer(computer_id);

    const computerDestroyedObject: ComputerDestroyedObject = {
      object: 'computer',
      id: computer.id,
      destroyed: true
    };

    res.status(200).json(computerDestroyedObject);
  } catch (err) {
    next(err);
  }
};

const ConnectComputerRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  params: z.object({ computer_id: z.string() })
});

export const connectComputer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ConnectComputerRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    if (computer.state !== 'started') {
      logger.info(`Starting computer...`);

      const t0 = nowUnix();
      await ComputeProvider.startComputer({
        project_id: computer.project_id,
        provider_computer_id: computer.provider_id
      });

      const startedComputer = await ComputerService.updateComputer(computer.id, {
        state: 'starting',
        updated_at: unixToISOString(t0)
      });

      await ComputerService.createComputerEvent({
        computer_id: computer.id,
        type: 'starting',
        timestamp: t0,
        metadata: null
      });

      ComputerHook.syncState({
        projectId: computer.project_id,
        computerId: computer.id,
        providerComputerId: computer.provider_id,
        currentState: 'starting',
        expectedState: 'started'
      });

      logger.info(`Start requested! ID: ${startedComputer.id}, State: ${startedComputer.state}`);
    }

    const computerObject: ComputerObject = {
      object: 'computer',
      id: computer.id,
      project_id: computer.project_id,
      template: computer.template_slug,
      instance_id: computer.provider_id,
      state: computer.state,
      region: computer.region,
      ttl_seconds: computer.ttl_seconds,
      auto_destroy: computer.auto_destroy,
      metadata: computer.metadata,
      created_at: computer.created_at,
      updated_at: computer.updated_at
    };

    res.status(200).json(computerObject);
  } catch (err) {
    next(err);
  }
};

const StartComputerRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  params: z.object({ computer_id: z.string() })
});

export const startComputer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = StartComputerRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    logger.info(`Starting computer...`);

    const t0 = nowUnix();
    await ComputeProvider.startComputer({
      project_id: computer.project_id,
      provider_computer_id: computer.provider_id
    });

    const startedComputer = await ComputerService.updateComputer(computer.id, {
      state: 'starting',
      updated_at: unixToISOString(t0)
    });

    await ComputerService.createComputerEvent({
      computer_id: computer.id,
      type: 'starting',
      timestamp: t0,
      metadata: null
    });

    ComputerHook.syncState({
      projectId: computer.project_id,
      computerId: computer.id,
      providerComputerId: computer.provider_id,
      currentState: 'starting',
      expectedState: 'started'
    });

    logger.info(`Start requested! ID: ${startedComputer.id}, State: ${startedComputer.state}`);

    const computerObject: ComputerObject = {
      object: 'computer',
      id: startedComputer.id,
      project_id: startedComputer.project_id,
      template: startedComputer.template_slug,
      instance_id: startedComputer.provider_id,
      state: startedComputer.state,
      region: startedComputer.region,
      ttl_seconds: startedComputer.ttl_seconds,
      auto_destroy: startedComputer.auto_destroy,
      metadata: startedComputer.metadata,
      created_at: startedComputer.created_at,
      updated_at: startedComputer.updated_at
    };

    res.status(200).json(computerObject);
  } catch (err) {
    next(err);
  }
};

const StopComputerRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  params: z.object({ computer_id: z.string() })
});

export const stopComputer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = StopComputerRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    logger.info(`Stopping computer...`);

    const t0 = nowUnix();
    await ComputeProvider.stopComputer({
      project_id: computer.project_id,
      provider_computer_id: computer.provider_id
    });

    const stoppedComputer = await ComputerService.updateComputer(computer.id, {
      state: 'stopping',
      updated_at: unixToISOString(t0)
    });

    await ComputerService.createComputerEvent({
      computer_id: computer.id,
      type: 'stopping',
      timestamp: t0,
      metadata: null
    });

    ComputerHook.syncState({
      projectId: computer.project_id,
      computerId: computer.id,
      providerComputerId: computer.provider_id,
      currentState: 'stopping',
      expectedState: 'stopped'
    });

    logger.info(`Stop requested! ID: ${stoppedComputer.id}, State: ${stoppedComputer.state}`);

    const computerObject: ComputerObject = {
      object: 'computer',
      id: stoppedComputer.id,
      project_id: stoppedComputer.project_id,
      template: stoppedComputer.template_slug,
      instance_id: stoppedComputer.provider_id,
      state: stoppedComputer.state,
      region: stoppedComputer.region,
      ttl_seconds: stoppedComputer.ttl_seconds,
      auto_destroy: stoppedComputer.auto_destroy,
      metadata: stoppedComputer.metadata,
      created_at: stoppedComputer.created_at,
      updated_at: stoppedComputer.updated_at
    };

    res.status(200).json(computerObject);
  } catch (err) {
    next(err);
  }
};

const WaitForStateRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema,
  params: z.object({ computer_id: z.string() }),
  query: z.object({
    state: z.enum(['started', 'stopped', 'destroyed']),
    timeout_sec: z.number().optional()
  })
});

export const waitForState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = WaitForStateRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      query: req.query
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    const { state, timeout_sec: timeoutSec } = parsedReq.data.query;
    if (computer.state === state) {
      res.status(200).json({ success: true, computer_id, state });
      return;
    }

    // Validate timeout
    let validTimeoutSec = timeoutSec;
    if (!validTimeoutSec) {
      validTimeoutSec = 60;
    } else if (validTimeoutSec > 60) {
      throw HttpError.badRequest('Timeout must be less than 60 seconds');
    } else if (validTimeoutSec < 1) {
      throw HttpError.badRequest('Timeout must be greater than 0 seconds');
    }

    await ComputeProvider.waitForState({
      project_id: computer.project_id,
      provider_computer_id: computer.provider_id,
      timeout_sec: validTimeoutSec,
      state
    });

    res.status(200).json({ success: true, computer_id, state });
  } catch (err) {
    next(err);
  }
};

const ForkComputerRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  params: z.object({ computer_id: z.string() })
});

export const forkComputer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ForkComputerRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);

    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    const t0 = nowUnix();
    const computerId = generateId(Resource.Computer);
    const forkedProviderComputer = await ComputeProvider.forkComputer({
      project_id: computer.project_id,
      provider_computer_id: computer.provider_id,
      computer_id: computerId,
      ttl_seconds: computer.ttl_seconds
    });

    const t1 = nowUnix();
    const forkedComputer = await ComputerService.createComputer({
      id: computerId,
      project_id: computer.project_id,
      template_slug: computer.template_slug,
      provider: forkedProviderComputer.provider,
      provider_id: forkedProviderComputer.provider_computer_id,
      region: forkedProviderComputer.region,
      state: 'starting',
      ttl_seconds: computer.ttl_seconds,
      auto_destroy: computer.auto_destroy,
      metadata: computer.metadata,
      created_at: unixToISOString(t0),
      updated_at: unixToISOString(t1)
    });

    await ComputerService.createComputerEvents([
      { computer_id: forkedComputer.id, type: 'created', timestamp: t0, metadata: null },
      { computer_id: forkedComputer.id, type: 'starting', timestamp: t1, metadata: null }
    ]);

    ComputerHook.syncState({
      projectId: computer.project_id,
      computerId: forkedComputer.id,
      providerComputerId: forkedProviderComputer.provider_computer_id,
      currentState: 'starting',
      expectedState: 'started'
    });

    const computerObject: ComputerObject = {
      object: 'computer',
      id: forkedComputer.id,
      project_id: forkedComputer.project_id,
      template: forkedComputer.template_slug,
      instance_id: forkedComputer.provider_id,
      state: forkedComputer.state,
      region: forkedComputer.region,
      ttl_seconds: forkedComputer.ttl_seconds,
      auto_destroy: forkedComputer.auto_destroy,
      metadata: forkedComputer.metadata,
      created_at: forkedComputer.created_at,
      updated_at: forkedComputer.updated_at
    };

    res.status(200).json(computerObject);
  } catch (err) {
    next(err);
  }
};
