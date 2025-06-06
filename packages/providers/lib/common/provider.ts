import { INSTANCE_TYPES } from '@metallichq/shared';
import {
  CreateComputerRequest,
  CreateComputerResponse,
  DestroyComputerRequest,
  ForkComputerRequest,
  ForkComputerResponse,
  Provider,
  RestartComputerRequest,
  StartComputerRequest,
  StopComputerRequest,
  WaitForStateRequest
} from '../common/types.js';
import * as FlyApps from '../fly/apps.js';
import { VOLUME_PATH } from '../fly/constants.js';
import * as FlyHelpers from '../fly/helpers.js';
import * as FlyMachines from '../fly/machines.js';
import { MachineGuest } from '../fly/types.js';
import * as FlyVolumes from '../fly/volumes.js';
import { createSystemEnv } from './env.js';

export const onProjectCreated = async (projectId: string): Promise<void> => {
  await FlyApps.createApp({ app_name: FlyHelpers.projectIdToAppName(projectId) });
};

export const onProjectDeleted = async (projectId: string): Promise<void> => {
  await FlyApps.destroyApp({ app_name: FlyHelpers.projectIdToAppName(projectId) });
};

export const createComputer = async (req: CreateComputerRequest): Promise<CreateComputerResponse> => {
  const instanceDetails = INSTANCE_TYPES[req.instance_type];
  if (!instanceDetails) {
    throw new Error('Failed to retrieve instance details');
  }

  const { flyRegion, metallicRegion } = await FlyHelpers.selectFlyRegion({
    region: req.region,
    gpu_kind: instanceDetails.gpu_kind,
    cpu_kind: instanceDetails.cpu_kind
  });

  const appName = FlyHelpers.projectIdToAppName(req.project_id);
  const volumeName = FlyHelpers.generateVolumeName();
  const compute: MachineGuest = {
    cpus: instanceDetails.cpus,
    cpu_kind: instanceDetails.cpu_kind,
    gpus: instanceDetails.gpus,
    gpu_kind: instanceDetails.gpu_kind,
    memory_mb: instanceDetails.memory_mb
  };

  const volume = await FlyVolumes.createVolume({
    app_name: appName,
    region: flyRegion,
    name: volumeName,
    size_gb: req.storage_gb,
    compute,
    compute_image: req.image
  });

  const systemEnv = await createSystemEnv({
    project_id: req.project_id,
    computer_id: req.computer_id,
    ttl_seconds: req.ttl_seconds
  });

  const machine = await FlyMachines.createMachine({
    app_name: appName,
    region: flyRegion,
    config: {
      image: req.image,
      guest: compute,
      mounts: [{ volume: volume.id, path: VOLUME_PATH }],
      init: req.init,
      env: { ...req.env, ...systemEnv },
      metadata: req.metadata
    }
  });

  return {
    provider: Provider.Fly,
    provider_computer_id: machine.id,
    region: metallicRegion,
    state: machine.state
  };
};

export const startComputer = async (req: StartComputerRequest): Promise<void> => {
  await FlyMachines.startMachine({
    app_name: FlyHelpers.projectIdToAppName(req.project_id),
    machine_id: req.provider_computer_id
  });
};

export const stopComputer = async (req: StopComputerRequest): Promise<void> => {
  await FlyMachines.suspendMachine({
    app_name: FlyHelpers.projectIdToAppName(req.project_id),
    machine_id: req.provider_computer_id
  });
};

export const forkComputer = async (req: ForkComputerRequest): Promise<ForkComputerResponse> => {
  const appName = FlyHelpers.projectIdToAppName(req.project_id);
  const machine = await FlyMachines.getMachine({
    app_name: appName,
    machine_id: req.provider_computer_id
  });

  if (!machine) {
    throw new Error(`Machine ${req.provider_computer_id} not found`);
  }

  const mount = machine.config.mounts?.[0];
  if (!mount) {
    throw new Error(`Machine ${req.provider_computer_id} has no mounted volume`);
  }

  const forkedVolume = await FlyVolumes.createVolume({
    app_name: appName,
    name: FlyHelpers.generateVolumeName(),
    source_volume_id: mount.volume,
    compute_image: FlyHelpers.fullImageRef(machine.image_ref),
    compute: machine.config.guest,
    region: machine.region
  });

  const systemEnv = await createSystemEnv({
    project_id: req.project_id,
    computer_id: req.computer_id,
    ttl_seconds: req.ttl_seconds
  });

  const forkedMachine = await FlyMachines.createMachine({
    app_name: appName,
    region: machine.region,
    config: {
      ...machine.config,
      env: { ...machine.config.env, ...systemEnv },
      mounts: [{ volume: forkedVolume.id, path: VOLUME_PATH }]
    }
  });

  return {
    provider_computer_id: forkedMachine.id,
    region: forkedMachine.region,
    state: forkedMachine.state,
    provider: Provider.Fly
  };
};

export const restartComputer = async (req: RestartComputerRequest): Promise<void> => {
  await FlyMachines.restartMachine({
    app_name: FlyHelpers.projectIdToAppName(req.project_id),
    machine_id: req.provider_computer_id
  });
};

export const waitForState = async (req: WaitForStateRequest): Promise<void> => {
  const appName = FlyHelpers.projectIdToAppName(req.project_id);
  const state = FlyHelpers.stateToFlyState(req.state);

  let instanceId: string | undefined;
  if (['suspended', 'destroyed'].includes(state)) {
    const machine = await FlyMachines.getMachine({
      app_name: appName,
      machine_id: req.provider_computer_id
    });
    instanceId = machine.instance_id;
  }

  await FlyMachines.waitForState({
    app_name: appName,
    machine_id: req.provider_computer_id,
    instance_id: instanceId,
    timeout_sec: req.timeout_sec,
    state
  });

  if (state === 'started') {
    await FlyMachines.healthCheck({ app_name: appName, machine_id: req.provider_computer_id });
  }
};

export const destroyComputer = async (req: DestroyComputerRequest): Promise<void> => {
  const appName = FlyHelpers.projectIdToAppName(req.project_id);

  const machine = await FlyMachines.getMachine({
    app_name: appName,
    machine_id: req.provider_computer_id
  });

  if (!machine) {
    throw new Error('Machine not found');
  }

  const mounts = machine.config.mounts || [];
  await FlyMachines.destroyMachine({
    app_name: appName,
    machine_id: req.provider_computer_id
  });

  await FlyMachines.waitForState({
    app_name: appName,
    machine_id: req.provider_computer_id,
    instance_id: machine.instance_id,
    state: 'destroyed'
  });

  for (const mount of mounts) {
    await FlyVolumes.destroyVolume({ app_name: appName, volume_id: mount.volume });
  }
};
