export const PAGINATION_MIN_LIMIT = 1;
export const PAGINATION_MAX_LIMIT = 100;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const SESSION_COOKIE_KEY = 'metallic_session';
export const DEFAULT_EMAIL_SUBSCRIPTIONS = ['billing', 'security', 'product'];
export const DEFAULT_PROJECT_NAME = 'Default Project';
export const DEFAULT_TEMPLATE_SLUG = 'base';
export const DEFAULT_TTL_SECONDS = 300000; // 5 minutes
export const DEFAULT_AUTO_DESTROY = false;

// Regions
export const DEFAULT_REGION = 'us-west-2';
export const REGIONS = ['us-west-2', 'us-east-1', 'eu-central-1', 'ap-southeast-1'];

// Storage
export const MIN_STORAGE_GB = 1;
export const MAX_STORAGE_GB = 500;

// Memory
export const MIN_MEMORY_MB_PER_SHARED_CPU = 256;
export const MIN_MEMORY_MB_PER_CPU = 2048;

// Instance types
export const INSTANCE_TYPES: Record<
  string,
  {
    cpu_kind: 'shared' | 'performance';
    cpus: number;
    gpu_kind?: 'a10' | 'l40s' | 'a100-pcie-40gb' | 'a100-sxm4-80gb';
    gpus?: number;
    memory_mb: number;
    default_storage_gb: number;
  }
> = {
  'cpu-1x': { cpu_kind: 'shared', cpus: 1, memory_mb: 1 * MIN_MEMORY_MB_PER_SHARED_CPU, default_storage_gb: 3 },
  'cpu-2x': { cpu_kind: 'shared', cpus: 2, memory_mb: 2 * MIN_MEMORY_MB_PER_SHARED_CPU, default_storage_gb: 5 },
  'cpu-4x': { cpu_kind: 'shared', cpus: 4, memory_mb: 4 * MIN_MEMORY_MB_PER_SHARED_CPU, default_storage_gb: 10 },
  'cpu-8x': { cpu_kind: 'shared', cpus: 8, memory_mb: 8 * MIN_MEMORY_MB_PER_SHARED_CPU, default_storage_gb: 10 },
  'cpu-16x': {
    cpu_kind: 'performance',
    cpus: 16,
    memory_mb: 16 * MIN_MEMORY_MB_PER_SHARED_CPU,
    default_storage_gb: 10
  },
  'a10-gpu-1x': {
    gpu_kind: 'a10',
    gpus: 1,
    cpu_kind: 'performance',
    cpus: 8,
    memory_mb: 16 * MIN_MEMORY_MB_PER_CPU,
    default_storage_gb: 10
  },
  'l40s-gpu-1x': {
    gpu_kind: 'l40s',
    gpus: 1,
    cpu_kind: 'performance',
    cpus: 8,
    memory_mb: 16 * MIN_MEMORY_MB_PER_CPU,
    default_storage_gb: 10
  },
  'a100-40gb-gpu-1x': {
    gpu_kind: 'a100-pcie-40gb',
    gpus: 1,
    cpu_kind: 'performance',
    cpus: 8,
    memory_mb: 16 * MIN_MEMORY_MB_PER_CPU,
    default_storage_gb: 50
  },
  'a100-80gb-gpu-1x': {
    gpu_kind: 'a100-sxm4-80gb',
    gpus: 1,
    cpu_kind: 'performance',
    cpus: 8,
    memory_mb: 16 * MIN_MEMORY_MB_PER_CPU,
    default_storage_gb: 50
  }
};

export const DEFAULT_INSTANCE_TYPE = 'cpu-4x';
