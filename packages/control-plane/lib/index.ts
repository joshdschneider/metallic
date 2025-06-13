import { Provider } from '@metallichq/providers';
import {
  BillingService,
  captureException,
  ComputerService,
  generateId,
  nowUnix,
  OrganizationService,
  Resource,
  unixToISOString
} from '@metallichq/shared';
import { Computer, ComputerState } from '@metallichq/types';

interface SyncStateRequest {
  projectId: string;
  computerId: string;
  providerComputerId: string;
  currentState: string;
  expectedState: string;
}

export const syncState = async (req: SyncStateRequest) => {
  const maxAttempts = 3;
  let attempts = 0;
  let machineInExpectedState = false;

  while (attempts < maxAttempts && !machineInExpectedState) {
    attempts++;
    try {
      await Provider.waitForState({
        project_id: req.projectId,
        provider_computer_id: req.providerComputerId,
        timeout_sec: 60,
        state: req.expectedState
      });

      machineInExpectedState = true;
    } catch (waitError) {
      if (attempts >= maxAttempts) {
        throw waitError;
      }
    }
  }

  const computer = await ComputerService.updateComputer(
    req.computerId,
    { state: req.expectedState as ComputerState },
    { allowUpdateDeleted: true }
  );

  await ComputerService.createComputerEvent({
    computer_id: computer.id,
    type: computer.state,
    timestamp: nowUnix(),
    metadata: null
  });

  const dbSyncMaxAttempts = 100;
  const dbSyncPollInterval = 500;

  for (let attempt = 1; attempt <= dbSyncMaxAttempts; attempt++) {
    const updatedComputer = await ComputerService.getComputerById(req.computerId, { includeDeleted: true });
    if (updatedComputer && updatedComputer.state === req.expectedState) {
      return;
    }

    if (attempt < dbSyncMaxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, dbSyncPollInterval));
    }
  }

  throw new Error(
    `Database state sync timeout in syncState for computer "${req.computerId}"; Expected "${req.expectedState}"`
  );
};

interface ReportUsageRequest {
  organizationId: string;
  computerId: string;
}

export const reportUsage = async (req: ReportUsageRequest) => {
  const [computer, organization] = await Promise.all([
    ComputerService.getComputerExtendedById(req.computerId, { includeDeleted: true }),
    OrganizationService.getOrganizationById(req.organizationId)
  ]);

  if (!computer) {
    throw new Error(`Computer not found by ID "${req.computerId}"`);
  }

  if (!organization) {
    throw new Error(`Organization not found by ID "${req.organizationId}"`);
  }

  await BillingService.calculateAndReportUsage(organization, computer);
};

interface CreateComputerRequest {
  projectId: string;
  templateSlug: string;
  region?: string;
  instanceType: string;
  storageGb: number;
  ttlSeconds: number | null;
  autoDestroy: boolean;
  image: string;
  init?: { cmd: string[]; entrypoint: string[] };
  env?: Record<string, string>;
  metadata?: Record<string, string>;
}

export const createComputer = async (req: CreateComputerRequest): Promise<Computer> => {
  const computerId = generateId(Resource.Computer);

  const t0 = nowUnix();
  const providerComputer = await Provider.createComputer({
    computer_id: computerId,
    project_id: req.projectId,
    instance_type: req.instanceType,
    storage_gb: req.storageGb,
    region: req.region,
    ttl_seconds: req.ttlSeconds,
    image: req.image,
    init: req.init,
    env: req.env,
    metadata: req.metadata
  });

  const t1 = nowUnix();
  const computer = await ComputerService.createComputer({
    id: computerId,
    project_id: req.projectId,
    template_slug: req.templateSlug,
    region: providerComputer.region,
    provider: providerComputer.provider,
    provider_computer_id: providerComputer.provider_computer_id,
    parent_computer_id: null,
    state: 'starting',
    ttl_seconds: req.ttlSeconds,
    auto_destroy: req.autoDestroy,
    metadata: req.metadata ?? null,
    created_at: unixToISOString(t0),
    updated_at: unixToISOString(t1)
  });

  await ComputerService.createComputerEvents([
    { computer_id: computer.id, type: 'created', timestamp: t0, metadata: null },
    { computer_id: computer.id, type: 'starting', timestamp: t1, metadata: null }
  ]);

  syncState({
    projectId: computer.project_id,
    computerId: computer.id,
    providerComputerId: providerComputer.provider_computer_id,
    currentState: 'starting',
    expectedState: 'started'
  }).catch((err) => captureException(err));

  return computer;
};

interface DestroyComputerRequest {
  organizationId: string;
  projectId: string;
  computerId: string;
  providerComputerId: string;
}

export const destroyComputer = async (req: DestroyComputerRequest): Promise<Computer> => {
  const computer = await ComputerService.getComputerById(req.computerId);
  if (!computer) {
    throw new Error(`Failed to retrieve computer by ID from control plane "${req.computerId}"`);
  }

  if (['destroying', 'destroyed'].includes(computer.state)) {
    const err = new Error(`Control plane received destroy request for computer already in state "${computer.state}"`);
    captureException(err);
    return computer;
  }

  const t1 = nowUnix();
  const destroyingComputer = await ComputerService.updateComputer(req.computerId, {
    state: 'destroying',
    updated_at: unixToISOString(t1)
  });

  await ComputerService.createComputerEvent({
    computer_id: req.computerId,
    type: 'destroying',
    timestamp: t1,
    metadata: null
  });

  Provider.destroyComputer({
    project_id: req.projectId,
    provider_computer_id: req.providerComputerId
  })
    .then(async () => {
      await syncState({
        projectId: req.projectId,
        computerId: req.computerId,
        providerComputerId: req.providerComputerId,
        currentState: 'destroying',
        expectedState: 'destroyed'
      });

      await ComputerService.destroyComputer(req.computerId);
      await reportUsage({ organizationId: req.organizationId, computerId: req.computerId });
    })
    .catch((err) => captureException(err));

  return destroyingComputer;
};

interface StartComputerRequest {
  projectId: string;
  computerId: string;
  providerComputerId: string;
}

export const startComputer = async (req: StartComputerRequest): Promise<Computer> => {
  const computer = await ComputerService.getComputerById(req.computerId);
  if (!computer) {
    throw new Error(`Failed to retrieve computer by ID from control plane "${req.computerId}"`);
  }

  if (['destroying', 'destroyed'].includes(computer.state)) {
    throw new Error(`Control plane received start request for computer in state "${computer.state}"`);
  }

  if (['starting', 'started'].includes(computer.state)) {
    const err = new Error(`Control plane received start request for computer already in state "${computer.state}"`);
    captureException(err);
    return computer;
  }

  const t0 = nowUnix();
  await Provider.startComputer({
    project_id: req.projectId,
    provider_computer_id: req.providerComputerId
  });

  const startingComputer = await ComputerService.updateComputer(req.computerId, {
    state: 'starting',
    updated_at: unixToISOString(t0)
  });

  await ComputerService.createComputerEvent({
    computer_id: req.computerId,
    type: 'starting',
    timestamp: t0,
    metadata: null
  });

  syncState({
    projectId: req.projectId,
    computerId: req.computerId,
    providerComputerId: req.providerComputerId,
    currentState: 'starting',
    expectedState: 'started'
  }).catch((err) => captureException(err));

  return startingComputer;
};

interface StopComputerRequest {
  organizationId: string;
  projectId: string;
  computerId: string;
  providerComputerId: string;
}

export const stopComputer = async (req: StopComputerRequest): Promise<Computer> => {
  const computer = await ComputerService.getComputerById(req.computerId);
  if (!computer) {
    throw new Error(`Failed to retrieve computer by ID from control plane "${req.computerId}"`);
  }

  if (['destroying', 'destroyed'].includes(computer.state)) {
    throw new Error(`Control plane received stop request for computer in state "${computer.state}"`);
  }

  if (['stopping', 'stopped'].includes(computer.state)) {
    const err = new Error(`Control plane received stop request for computer already in state "${computer.state}"`);
    captureException(err);
    return computer;
  }

  const t0 = nowUnix();
  await Provider.stopComputer({
    project_id: req.projectId,
    provider_computer_id: req.providerComputerId
  });

  const stoppingComputer = await ComputerService.updateComputer(req.computerId, {
    state: 'stopping',
    updated_at: unixToISOString(t0)
  });

  await ComputerService.createComputerEvent({
    computer_id: req.computerId,
    type: 'stopping',
    timestamp: t0,
    metadata: null
  });

  syncState({
    projectId: req.projectId,
    computerId: req.computerId,
    providerComputerId: req.providerComputerId,
    currentState: 'stopping',
    expectedState: 'stopped'
  })
    .then(async () => {
      if (stoppingComputer.auto_destroy) {
        await destroyComputer({
          organizationId: req.organizationId,
          projectId: req.projectId,
          computerId: req.computerId,
          providerComputerId: req.providerComputerId
        });
      } else {
        await reportUsage({
          organizationId: req.organizationId,
          computerId: req.computerId
        });
      }
    })
    .catch((err) => captureException(err));

  return stoppingComputer;
};

interface WaitForStateRequest {
  projectId: string;
  computerId: string;
  providerComputerId: string;
  state: ComputerState;
  timeoutSec: number;
}

export const waitForState = async (req: WaitForStateRequest): Promise<void> => {
  await Provider.waitForState({
    project_id: req.projectId,
    provider_computer_id: req.providerComputerId,
    timeout_sec: req.timeoutSec,
    state: req.state
  });

  const maxAttempts = 120;
  const pollInterval = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const computer = await ComputerService.getComputerById(req.computerId, { includeDeleted: true });
    if (computer && computer.state === req.state) {
      return;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(
    `Database state sync timeout in waitForState for computer "${req.computerId}"; Expected "${req.state}"`
  );
};

interface ForkComputerRequest {
  projectId: string;
  templateSlug: string;
  parentComputerId: string;
  parentProviderComputerId: string;
  ttlSeconds: number | null;
  autoDestroy: boolean;
  metadata: Record<string, string> | null;
}

export const forkComputer = async (req: ForkComputerRequest): Promise<Computer> => {
  const parentComputer = await ComputerService.getComputerById(req.parentComputerId);
  if (!parentComputer) {
    throw new Error(`Failed to retrieve parent computer by ID from control plane "${req.parentComputerId}"`);
  }

  if (['destroying', 'destroyed'].includes(parentComputer.state)) {
    throw new Error(`Control plane received fork request for parent computer in state "${parentComputer.state}"`);
  }

  const t0 = nowUnix();
  const computerId = generateId(Resource.Computer);
  const forkedProviderComputer = await Provider.forkComputer({
    project_id: req.projectId,
    parent_provider_computer_id: req.parentProviderComputerId,
    parent_computer_id: req.parentComputerId,
    computer_id: computerId,
    ttl_seconds: req.ttlSeconds
  });

  const t1 = nowUnix();
  const forkedComputer = await ComputerService.createComputer({
    id: computerId,
    project_id: req.projectId,
    template_slug: req.templateSlug,
    parent_computer_id: req.parentComputerId,
    provider_computer_id: forkedProviderComputer.provider_computer_id,
    provider: forkedProviderComputer.provider,
    region: forkedProviderComputer.region,
    state: 'starting',
    ttl_seconds: req.ttlSeconds,
    auto_destroy: req.autoDestroy,
    metadata: req.metadata,
    created_at: unixToISOString(t0),
    updated_at: unixToISOString(t1)
  });

  await ComputerService.createComputerEvents([
    { computer_id: forkedComputer.id, type: 'created', timestamp: t0, metadata: null },
    { computer_id: forkedComputer.id, type: 'starting', timestamp: t1, metadata: null }
  ]);

  syncState({
    projectId: forkedComputer.project_id,
    computerId: forkedComputer.id,
    providerComputerId: forkedProviderComputer.provider_computer_id,
    currentState: 'starting',
    expectedState: 'started'
  }).catch((err) => captureException(err));

  return forkedComputer;
};

export const onProjectCreated = async (projectId: string): Promise<void> => {
  await Provider.onProjectCreated(projectId);
};

export const onProjectDeleted = async (projectId: string): Promise<void> => {
  await Provider.onProjectDeleted(projectId);
};
