import * as grpc from '@grpc/grpc-js';
import { DEFAULT_AGENT_PORT } from '@metallichq/shared';
import { AgentClient } from '../generated/agent.js';
import { api } from './api.js';
import { Machine, MachineConfig } from './types.js';

interface GetMachineRequest {
  app_name: string;
  machine_id: string;
}

export const getMachine = async (req: GetMachineRequest): Promise<Machine> => {
  const res = await api.get<Machine>(`/v1/apps/${req.app_name}/machines/${req.machine_id}`);
  return res.data;
};

interface CreateMachineRequest {
  app_name: string;
  region: string;
  config: MachineConfig;
  name?: string;
}

export const createMachine = async (req: CreateMachineRequest): Promise<Machine> => {
  const res = await api.post<Machine>(`/v1/apps/${req.app_name}/machines`, {
    region: req.region,
    config: req.config,
    name: req.name
  });
  return res.data;
};

interface StartMachineRequest {
  app_name: string;
  machine_id: string;
}

export const startMachine = async (req: StartMachineRequest): Promise<void> => {
  await api.post(`/v1/apps/${req.app_name}/machines/${req.machine_id}/start`);
};

interface StopMachineRequest {
  app_name: string;
  machine_id: string;
}

export const stopMachine = async (req: StopMachineRequest): Promise<void> => {
  await api.post(`/v1/apps/${req.app_name}/machines/${req.machine_id}/stop`);
};

interface SuspendMachineRequest {
  app_name: string;
  machine_id: string;
}

export const suspendMachine = async (req: SuspendMachineRequest): Promise<void> => {
  await api.post(`/v1/apps/${req.app_name}/machines/${req.machine_id}/suspend`);
};

interface RestartMachineRequest {
  app_name: string;
  machine_id: string;
}

export const restartMachine = async (req: RestartMachineRequest): Promise<void> => {
  await api.post(`/v1/apps/${req.app_name}/machines/${req.machine_id}/restart`);
};

interface DestroyMachineRequest {
  app_name: string;
  machine_id: string;
}

export const destroyMachine = async (req: DestroyMachineRequest): Promise<void> => {
  await api.delete(`/v1/apps/${req.app_name}/machines/${req.machine_id}?force=true`);
};

interface WaitForStateRequest {
  app_name: string;
  machine_id: string;
  state: string;
  instance_id?: string;
  timeout_sec?: number;
}

export const waitForState = async (req: WaitForStateRequest): Promise<void> => {
  const params = new URLSearchParams();
  params.set('state', req.state);
  if (req.instance_id) {
    params.set('instance_id', req.instance_id);
  }

  if (req.timeout_sec) {
    params.set('timeout', req.timeout_sec.toString());
  }

  await api.get(`/v1/apps/${req.app_name}/machines/${req.machine_id}/wait?${params.toString()}`);
};

interface HealthCheckRequest {
  app_name: string;
  machine_id: string;
}

const checkHealth = async (req: HealthCheckRequest): Promise<void> => {
  const client = new AgentClient(
    `${req.app_name}-${req.machine_id}-${DEFAULT_AGENT_PORT}.metallic.computer:443`,
    grpc.credentials.createSsl()
  );

  return new Promise((resolve, reject) => {
    client.healthCheck({}, (err, response) => {
      if (err) {
        reject(err);
      } else if (!response.success) {
        reject(new Error(response.error));
      } else {
        resolve();
      }
    });
  });
};

export const healthCheck = async (req: HealthCheckRequest): Promise<void> => {
  const timeout = 3000;
  const interval = 100;
  const maxAttempts = Math.ceil(timeout / interval);

  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      await checkHealth(req);
      return;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error(`Machine health check failed after ${attempts} attempts (${timeout}ms)`);
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new Error(`Machine health check timed out after ${timeout}ms`);
};
