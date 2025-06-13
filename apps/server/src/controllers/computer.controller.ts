import * as ControlPlane from '@metallichq/control-plane';
import {
  ComputerService,
  DEFAULT_AUTO_DESTROY,
  DEFAULT_TEMPLATE_SLUG,
  HttpError,
  PaywallClient,
  TemplateService
} from '@metallichq/shared';
import { ComputerObject, ComputerStateSchema, PaginationParametersSchema, Template } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ResponseLocalsSchema } from '../utils/locals.js';
import { getProjectIdFromLocals } from '../utils/project.js';
import { validateRegion, validateTtlSeconds } from '../utils/validators.js';

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
        instance_id: computer.provider_computer_id,
        parent_computer_id: computer.parent_computer_id,
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

    const {
      body,
      locals: { organization, subscriptions }
    } = parsedReq.data;
    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const paywallChecks = Promise.all([
      PaywallClient.checkConcurrency({ subscriptions, organizationId: organization.id }),
      PaywallClient.checkMonthlyUsage({ subscriptions, organizationId: organization.id })
    ]);

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

    PaywallClient.checkInstanceType({ subscriptions, instanceType: template.instance_type });
    await paywallChecks;

    const region = validateRegion(body.region);
    const ttlSeconds = validateTtlSeconds(body.ttl_seconds);
    const autoDestroy = body.auto_destroy ?? DEFAULT_AUTO_DESTROY;

    const computer = await ControlPlane.createComputer({
      projectId,
      templateSlug: template.slug,
      instanceType: template.instance_type,
      storageGb: template.storage_gb,
      region,
      ttlSeconds,
      autoDestroy,
      image: template.image,
      init: template.init ?? undefined,
      env: body.env,
      metadata: body.metadata
    });

    const computerObject: ComputerObject = {
      object: 'computer',
      id: computer.id,
      project_id: computer.project_id,
      template: computer.template_slug,
      instance_id: computer.provider_computer_id,
      parent_computer_id: computer.parent_computer_id,
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
      instance_id: computer.provider_computer_id,
      parent_computer_id: computer.parent_computer_id,
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
    metadata: z.record(z.string(), z.string()).nullable().optional()
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

    let { metadata } = parsedReq.data.body;
    const updatedComputer = await ComputerService.updateComputer(computer_id, { metadata });

    const computerObject: ComputerObject = {
      object: 'computer',
      id: updatedComputer.id,
      project_id: updatedComputer.project_id,
      template: updatedComputer.template_slug,
      instance_id: updatedComputer.provider_computer_id,
      parent_computer_id: updatedComputer.parent_computer_id,
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

    const { organization } = parsedReq.data.locals;
    const { computer_id } = parsedReq.data.params;

    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    const destroyingComputer = await ControlPlane.destroyComputer({
      organizationId: organization.id,
      projectId: computer.project_id,
      computerId: computer.id,
      providerComputerId: computer.provider_computer_id
    });

    const computerObject: ComputerObject = {
      object: 'computer',
      id: destroyingComputer.id,
      project_id: destroyingComputer.project_id,
      template: destroyingComputer.template_slug,
      instance_id: destroyingComputer.provider_computer_id,
      parent_computer_id: destroyingComputer.parent_computer_id,
      state: destroyingComputer.state,
      region: destroyingComputer.region,
      ttl_seconds: destroyingComputer.ttl_seconds,
      auto_destroy: destroyingComputer.auto_destroy,
      metadata: destroyingComputer.metadata,
      created_at: destroyingComputer.created_at,
      updated_at: destroyingComputer.updated_at
    };

    res.status(200).json(computerObject);
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

    if (!['starting', 'started'].includes(computer.state)) {
      await ControlPlane.startComputer({
        projectId: computer.project_id,
        computerId: computer.id,
        providerComputerId: computer.provider_computer_id
      });
    }

    const computerObject: ComputerObject = {
      object: 'computer',
      id: computer.id,
      project_id: computer.project_id,
      template: computer.template_slug,
      instance_id: computer.provider_computer_id,
      parent_computer_id: computer.parent_computer_id,
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

    const {
      locals: { organization, subscriptions }
    } = parsedReq.data;

    const paywallChecks = Promise.all([
      PaywallClient.checkConcurrency({ subscriptions, organizationId: organization.id }),
      PaywallClient.checkMonthlyUsage({ subscriptions, organizationId: organization.id })
    ]);

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    await paywallChecks;
    const startedComputer = await ControlPlane.startComputer({
      projectId: computer.project_id,
      computerId: computer.id,
      providerComputerId: computer.provider_computer_id
    });

    const computerObject: ComputerObject = {
      object: 'computer',
      id: startedComputer.id,
      project_id: startedComputer.project_id,
      template: startedComputer.template_slug,
      instance_id: startedComputer.provider_computer_id,
      parent_computer_id: startedComputer.parent_computer_id,
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

    const { organization } = parsedReq.data.locals;
    const { computer_id } = parsedReq.data.params;

    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    const stoppingComputer = await ControlPlane.stopComputer({
      organizationId: organization.id,
      projectId: computer.project_id,
      computerId: computer.id,
      providerComputerId: computer.provider_computer_id
    });

    const computerObject: ComputerObject = {
      object: 'computer',
      id: stoppingComputer.id,
      project_id: stoppingComputer.project_id,
      template: stoppingComputer.template_slug,
      instance_id: stoppingComputer.provider_computer_id,
      parent_computer_id: stoppingComputer.parent_computer_id,
      state: stoppingComputer.state,
      region: stoppingComputer.region,
      ttl_seconds: stoppingComputer.ttl_seconds,
      auto_destroy: stoppingComputer.auto_destroy,
      metadata: stoppingComputer.metadata,
      created_at: stoppingComputer.created_at,
      updated_at: stoppingComputer.updated_at
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

    await ControlPlane.waitForState({
      projectId: computer.project_id,
      computerId: computer.id,
      providerComputerId: computer.provider_computer_id,
      timeoutSec: validTimeoutSec,
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

    const { organization, subscriptions } = parsedReq.data.locals;
    const paywallChecks = Promise.all([
      PaywallClient.checkConcurrency({ subscriptions, organizationId: organization.id }),
      PaywallClient.checkMonthlyUsage({ subscriptions, organizationId: organization.id })
    ]);

    const { computer_id } = parsedReq.data.params;
    const computer = await ComputerService.getComputerById(computer_id);
    if (!computer) {
      throw HttpError.notFound(`Computer not found with ID "${computer_id}"`);
    }

    await paywallChecks;
    const forkedComputer = await ControlPlane.forkComputer({
      projectId: computer.project_id,
      parentComputerId: computer.id,
      parentProviderComputerId: computer.provider_computer_id,
      templateSlug: computer.template_slug,
      ttlSeconds: computer.ttl_seconds,
      autoDestroy: computer.auto_destroy,
      metadata: computer.metadata
    });

    const computerObject: ComputerObject = {
      object: 'computer',
      id: forkedComputer.id,
      project_id: forkedComputer.project_id,
      template: forkedComputer.template_slug,
      instance_id: forkedComputer.provider_computer_id,
      parent_computer_id: forkedComputer.parent_computer_id,
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
