export interface App {
  id: string;
  name: string;
  status: string;
  organization: {
    name: string;
    slug: string;
  };
}

export interface MachineImageRef {
  registry: string;
  repository: string;
  tag?: string | null;
  digest?: string | null;
}

export interface MachineGuest {
  cpu_kind?: string | null;
  gpu_kind?: string | null;
  cpus?: number | null;
  gpus?: number | null;
  memory_mb?: number | null;
}

export interface MachineEvent {
  id: string;
  type: string;
  status: string;
  source?: string | null;
  timestamp: number;
}

export interface MachineInit {
  cmd?: string[];
  entrypoint?: string[];
  exec?: string[];
  kernel_args?: string[];
  swap_size_mb?: number;
  tty?: boolean;
}

export interface MachineMount {
  volume: string;
  path: string;
}

export interface MachineConfig {
  image: string;
  init?: MachineInit;
  guest?: MachineGuest;
  mounts?: MachineMount[];
  env?: Record<string, string>;
  metadata?: Record<string, string>;
}

export interface Machine {
  id: string;
  name: string;
  instance_id: string;
  region: string;
  state: string;
  image_ref: MachineImageRef;
  config: MachineConfig;
  events: MachineEvent[];
  created_at: string;
  updated_at?: string | null;
}

export interface Volume {
  id: string;
  name: string;
  size_gb: number;
  region: string;
  zone: string;
  state: string;
  attached_machine_id?: string | null;
}
