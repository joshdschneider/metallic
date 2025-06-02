export enum Provider {
  Fly = 'fly'
}

export interface CreateComputerRequest {
  project_id: string;
  region?: string;
  instance_type: string;
  storage_gb: number;
  image: string;
  init?: {
    cmd: string[];
    entrypoint: string[];
  };
  env?: Record<string, string>;
  metadata?: Record<string, string>;
  skip_launch?: boolean;
}

export interface CreateComputerResponse {
  id: string;
  provider: string;
  state: string;
  region: string;
}

export interface ForkComputerResponse {
  id: string;
  provider: string;
  state: string;
  region: string;
}

interface ProviderComputerIdentifier {
  project_id: string;
  id: string;
}

export type StartComputerRequest = ProviderComputerIdentifier;
export type StopComputerRequest = ProviderComputerIdentifier;
export type ForkComputerRequest = ProviderComputerIdentifier;
export type RestartComputerRequest = ProviderComputerIdentifier;

export type WaitForStateRequest = ProviderComputerIdentifier & {
  timeout_sec: number;
  state: string;
};

export type DestroyComputerRequest = ProviderComputerIdentifier;
