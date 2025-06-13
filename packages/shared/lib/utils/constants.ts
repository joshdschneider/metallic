import { SubscriptionPlan, Template } from '@metallichq/types';
import Stripe from 'stripe';
import { envVars } from './env-vars.js';

export const PAGINATION_MIN_LIMIT = 1;
export const PAGINATION_MAX_LIMIT = 100;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const SESSION_COOKIE_KEY = 'metallic_session';
export const DEFAULT_EMAIL_SUBSCRIPTIONS = ['billing', 'security', 'product'];
export const DEFAULT_PROJECT_NAME = 'Default Project';
export const DEFAULT_TTL_SECONDS = 300; // 5 minutes
export const DEFAULT_AUTO_DESTROY = false;
export const DEFAULT_AGENT_PORT = 50051;
export const DEFAULT_INSTANCE_TYPE = 'cpu-4x';
export const DEFAULT_TEMPLATE_SLUG = 'base';
export const DEFAULT_REGION = 'us-west-2';
export const REGIONS = ['us-west-2', 'us-east-1', 'eu-central-1', 'ap-southeast-1'];
export const MIN_STORAGE_GB = 1;
export const MAX_STORAGE_GB = 500;
export const MEMORY_MB_PER_CPU = 2048;
export const FREE_PLAN_MAX_COMPUTE_HOURS = 100;

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
  'cpu-1x': {
    cpu_kind: 'shared',
    cpus: 1,
    memory_mb: 1 * MEMORY_MB_PER_CPU,
    default_storage_gb: 3
  },
  'cpu-2x': {
    cpu_kind: 'shared',
    cpus: 2,
    memory_mb: 2 * MEMORY_MB_PER_CPU,
    default_storage_gb: 5
  },
  'cpu-4x': {
    cpu_kind: 'shared',
    cpus: 4,
    memory_mb: 4 * MEMORY_MB_PER_CPU,
    default_storage_gb: 10
  },
  'cpu-8x': {
    cpu_kind: 'shared',
    cpus: 8,
    memory_mb: 8 * MEMORY_MB_PER_CPU,
    default_storage_gb: 10
  },
  'cpu-16x': {
    cpu_kind: 'performance',
    cpus: 16,
    memory_mb: 16 * MEMORY_MB_PER_CPU,
    default_storage_gb: 10
  },
  'gpu-a10': {
    gpu_kind: 'a10',
    gpus: 1,
    cpu_kind: 'performance',
    cpus: 8,
    memory_mb: 16 * MEMORY_MB_PER_CPU,
    default_storage_gb: 10
  },
  'gpu-l40s': {
    gpu_kind: 'l40s',
    gpus: 1,
    cpu_kind: 'performance',
    cpus: 8,
    memory_mb: 16 * MEMORY_MB_PER_CPU,
    default_storage_gb: 10
  },
  'gpu-a100-40gb': {
    gpu_kind: 'a100-pcie-40gb',
    gpus: 1,
    cpu_kind: 'performance',
    cpus: 8,
    memory_mb: 16 * MEMORY_MB_PER_CPU,
    default_storage_gb: 50
  },
  'gpu-a100-80gb': {
    gpu_kind: 'a100-sxm4-80gb',
    gpus: 1,
    cpu_kind: 'performance',
    cpus: 8,
    memory_mb: 16 * MEMORY_MB_PER_CPU,
    default_storage_gb: 50
  }
};

export const CONCURRENCY_LIMITS: Record<SubscriptionPlan, number> = {
  free: 10,
  developer: 100,
  team: Infinity,
  enterprise: Infinity
};

export const ALLOWED_INSTANCE_TYPES: Record<SubscriptionPlan, string[]> = {
  free: ['cpu-1x', 'cpu-2x', 'cpu-4x', 'cpu-8x'],
  developer: Object.keys(INSTANCE_TYPES),
  team: Object.keys(INSTANCE_TYPES),
  enterprise: Object.keys(INSTANCE_TYPES)
};

export const INITIAL_TEMPLATES: Omit<Template, 'created_at' | 'updated_at' | 'deleted_at'>[] = [
  {
    slug: 'base',
    name: 'Base',
    description: `A minimal computer template Node.js, Python, and basic utilities pre-installed.`,
    instance_type: 'cpu-4x',
    storage_gb: 5,
    rootfs_gb: 2,
    image: 'metallichq/base:1.3.0',
    init: { cmd: [], entrypoint: ['/usr/local/metallic/entrypoint.sh'] },
    is_public: true,
    project_id: null
  }
];

export const STRIPE_PRICE_MAP: Record<string, string> =
  envVars.NODE_ENV === 'production'
    ? {
        team_license: 'price_1RX9zD1d4JjEC9gMTrY8UtJq',
        developer_license: 'price_1RX9yn1d4JjEC9gMTVhFoYrG',
        storage_gb_seconds: 'price_1RXA1Y1d4JjEC9gM2lz8T7rc',
        compute_cpu_1x: 'price_1RX9mO1d4JjEC9gMLyNhzWUH',
        compute_cpu_2x: 'price_1RX9nB1d4JjEC9gMfwCbJysZ',
        compute_cpu_4x: 'price_1RX9nx1d4JjEC9gMrreWdIcA',
        compute_cpu_8x: 'price_1RX9oY1d4JjEC9gMeXTxFYWJ',
        compute_cpu_16x: 'price_1RX9oy1d4JjEC9gMQI7ut3h8',
        compute_gpu_a10: 'price_1RX9qs1d4JjEC9gMlJRS9tLa',
        compute_gpu_l40s: 'price_1RX9rO1d4JjEC9gMPiY8e6PJ',
        compute_gpu_a100_40gb: 'price_1RX9rp1d4JjEC9gMeYc0Yzd6',
        compute_gpu_a100_80gb: 'price_1RX9tV1d4JjEC9gMLe5vDMwh'
      }
    : {
        team_license: 'price_1RXr6BP9GULStXZHSqDMc4xA',
        developer_license: 'price_1RXr5nP9GULStXZHO7jfuwRU',
        storage_gb_seconds: 'price_1RXr5DP9GULStXZHBe7Y0Ah1',
        compute_cpu_4x: 'price_1RXr3wP9GULStXZHTdBndK1P'
      };

export const STRIPE_PLAN_ITEMS: Record<string, Stripe.SubscriptionCreateParams.Item[]> =
  envVars.NODE_ENV === 'production'
    ? {
        developer: [
          { price: STRIPE_PRICE_MAP['developer_license'], quantity: 1 },
          { price: STRIPE_PRICE_MAP['storage_gb_seconds'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_1x'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_2x'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_4x'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_8x'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_16x'] },
          { price: STRIPE_PRICE_MAP['compute_gpu_a10'] },
          { price: STRIPE_PRICE_MAP['compute_gpu_l40s'] },
          { price: STRIPE_PRICE_MAP['compute_gpu_a100_40gb'] },
          { price: STRIPE_PRICE_MAP['compute_gpu_a100_80gb'] }
        ],
        team: [
          { price: STRIPE_PRICE_MAP['team_license'], quantity: 1 },
          { price: STRIPE_PRICE_MAP['storage_gb_seconds'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_1x'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_2x'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_4x'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_8x'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_16x'] },
          { price: STRIPE_PRICE_MAP['compute_gpu_a10'] },
          { price: STRIPE_PRICE_MAP['compute_gpu_l40s'] },
          { price: STRIPE_PRICE_MAP['compute_gpu_a100_40gb'] },
          { price: STRIPE_PRICE_MAP['compute_gpu_a100_80gb'] }
        ]
      }
    : {
        developer: [
          { price: STRIPE_PRICE_MAP['developer_license'], quantity: 1 },
          { price: STRIPE_PRICE_MAP['storage_gb_seconds'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_4x'] }
        ],
        team: [
          { price: STRIPE_PRICE_MAP['team_license'], quantity: 1 },
          { price: STRIPE_PRICE_MAP['storage_gb_seconds'] },
          { price: STRIPE_PRICE_MAP['compute_cpu_4x'] }
        ]
      };
