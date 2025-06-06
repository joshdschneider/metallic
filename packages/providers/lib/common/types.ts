export enum Provider {
  Fly = 'fly'
}

export interface CreateComputerRequest {
  project_id: string;
  computer_id: string;
  region?: string;
  instance_type: string;
  storage_gb: number;
  ttl_seconds: number | null;
  image: string;
  init?: {
    cmd: string[];
    entrypoint: string[];
  };
  env?: Record<string, string>;
  metadata?: Record<string, string>;
}

export interface CreateComputerResponse {
  provider_computer_id: string;
  provider: string;
  state: string;
  region: string;
}

export interface ForkComputerResponse {
  provider_computer_id: string;
  provider: string;
  state: string;
  region: string;
}

interface ProviderComputerIdentifier {
  project_id: string;
  provider_computer_id: string;
}

export type GetComputerRequest = ProviderComputerIdentifier;

export interface GetComputerResponse {
  provider_computer_id: string;
  provider: string;
  state: string;
  region: string;
}

export type StartComputerRequest = ProviderComputerIdentifier;
export type StopComputerRequest = ProviderComputerIdentifier;
export type RestartComputerRequest = ProviderComputerIdentifier;

export type ForkComputerRequest = ProviderComputerIdentifier & {
  computer_id: string;
  ttl_seconds: number | null;
};

export type WaitForStateRequest = ProviderComputerIdentifier & {
  timeout_sec: number;
  state: string;
};

export type DestroyComputerRequest = ProviderComputerIdentifier;
