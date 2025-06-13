import { database, Prisma } from '@metallichq/database';
import {
  Computer,
  ComputerEvent,
  ComputerEventSchema,
  ComputerSchema,
  ComputerState,
  PaginationParameters,
  Template,
  TemplateSchema,
  UsageRecord,
  UsageRecordSchema
} from '@metallichq/types';
import { z } from 'zod';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, PAGINATION_MIN_LIMIT } from '../utils/constants.js';
import { generateId, now, nowUnix, Resource } from '../utils/helpers.js';

export const getComputerById = async (id: string, options?: { includeDeleted?: boolean }): Promise<Computer | null> => {
  const computer = await database.computer.findUnique({
    where: { id, deleted_at: options?.includeDeleted ? undefined : null }
  });

  if (!computer) {
    return null;
  }

  return ComputerSchema.parse(computer);
};

export const getComputerExtendedById = async (
  id: string,
  options?: { includeDeleted?: boolean }
): Promise<(Computer & { template: Template; events: ComputerEvent[]; usage_records: UsageRecord[] }) | null> => {
  const computer = await database.computer.findUnique({
    where: { id, deleted_at: options?.includeDeleted ? undefined : null },
    include: {
      template: true,
      events: true,
      usage_records: true
    }
  });

  if (!computer) {
    return null;
  }

  return ComputerSchema.extend({
    events: z.array(ComputerEventSchema),
    usage_records: z.array(UsageRecordSchema),
    template: TemplateSchema
  }).parse(computer);
};

export const countComputersByProjectId = async (projectId: string): Promise<number> => {
  const count = await database.computer.count({
    where: { deleted_at: null, project_id: projectId }
  });

  return count;
};

export const countRunningComputers = async (organizationId: string): Promise<number> => {
  return await database.computer.count({
    where: {
      project: { organization_id: organizationId },
      state: { in: ['started', 'starting'] },
      deleted_at: null
    }
  });
};

export const getComputersByProjectId = async (
  projectId: string,
  options?: {
    region?: string;
    state?: ComputerState;
    template?: string;
  } & PaginationParameters
): Promise<{
  computers: Computer[];
  hasMore: boolean;
  cursorFirst: string | null;
  cursorLast: string | null;
}> => {
  const where: Prisma.ComputerWhereInput = {
    deleted_at: null,
    project_id: projectId
  };

  if (options?.region) {
    where.region = options.region;
  }

  if (options?.state) {
    where.state = options.state;
  }

  if (options?.template) {
    where.template_slug = options.template;
  }

  let cursor: Prisma.ComputerWhereUniqueInput | undefined;
  const orderBy: Prisma.ComputerOrderByWithRelationInput = {
    created_at: options?.order || 'desc'
  };

  const limit = Math.min(
    PAGINATION_MAX_LIMIT,
    Math.max(PAGINATION_MIN_LIMIT, options?.limit || PAGINATION_DEFAULT_LIMIT)
  );

  let take = limit + 1;
  let skip = 0;

  if (options?.after) {
    cursor = { id: options.after };
    skip = 1;
  } else if (options?.before) {
    cursor = { id: options.before };
    skip = 1;
    take = -take;
    orderBy.created_at = orderBy.created_at === 'asc' ? 'desc' : 'asc';
  }

  const computersRaw = await database.computer.findMany({
    where,
    cursor,
    skip,
    take,
    orderBy
  });

  let computers = z.array(ComputerSchema).parse(computersRaw);
  const hasMore = computers.length > limit;
  if (hasMore) {
    computers = computers.slice(0, -1);
  }

  if (options?.before) {
    computers.reverse();
  }

  const cursorFirst = computers[0]?.id || null;
  const cursorLast = computers[computers.length - 1]?.id || null;

  return { computers, hasMore, cursorFirst, cursorLast };
};

export const createComputer = async (data: Omit<Computer, 'deleted_at'>): Promise<Computer> => {
  const computer = await database.computer.create({
    data: {
      ...data,
      metadata: data.metadata ?? undefined,
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    }
  });

  return ComputerSchema.parse(computer);
};

export const updateComputer = async (
  computerId: string,
  data: Partial<Computer>,
  options?: { allowUpdateDeleted?: boolean }
): Promise<Computer> => {
  const updatedComputer = await database.computer.update({
    where: { id: computerId, deleted_at: options?.allowUpdateDeleted ? null : undefined },
    data: { ...data, metadata: data.metadata ?? undefined, updated_at: now() }
  });

  return ComputerSchema.parse(updatedComputer);
};

export const destroyComputer = async (computerId: string): Promise<void> => {
  await database.computer.update({
    where: { id: computerId, deleted_at: null },
    data: { id: computerId, deleted_at: now() }
  });
};

export const createComputerEvent = async (data: Omit<ComputerEvent, 'id'>): Promise<void> => {
  await database.computerEvent.create({
    data: {
      ...data,
      id: generateId(Resource.ComputerEvent),
      timestamp: nowUnix(),
      metadata: data.metadata ?? undefined
    }
  });
};

export const createComputerEvents = async (events: Omit<ComputerEvent, 'id'>[]): Promise<void> => {
  await database.computerEvent.createMany({
    data: events.map((event) => ({
      ...event,
      id: generateId(Resource.ComputerEvent),
      timestamp: nowUnix(),
      metadata: event.metadata ?? undefined
    }))
  });
};

export const getChildren = async (parentComputerId: string): Promise<Computer[]> => {
  const computers = await database.computer.findMany({
    where: { parent_computer_id: parentComputerId, deleted_at: null }
  });
  return z.array(ComputerSchema).parse(computers);
};
