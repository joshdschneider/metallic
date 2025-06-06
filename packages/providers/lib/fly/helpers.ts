import { DEFAULT_REGION, HttpError } from '@metallichq/shared';
import { api } from './api.js';
import { MachineImageRef } from './types.js';

export const selectFlyRegion = async (opts: {
  region?: string;
  gpu_kind?: 'a10' | 'l40s' | 'a100-pcie-40gb' | 'a100-sxm4-80gb';
  cpu_kind?: 'shared' | 'performance';
}): Promise<{
  flyRegion: string;
  metallicRegion: string;
}> => {
  let candidateRegions: string[] = [];

  if (!opts.region && !opts.gpu_kind && !opts.cpu_kind) {
    // If no constraints provided, check capacity for default region (us-west-2)
    candidateRegions = REGION_MAP[DEFAULT_REGION] || [];
  } else if (opts.gpu_kind && !opts.region) {
    // If gpu_kind is provided (with or without cpu_kind), use GPU-compatible regions
    candidateRegions = GPU_REGION_MAP[opts.gpu_kind] || [];
  } else if (opts.cpu_kind && !opts.region && !opts.gpu_kind) {
    // If only cpu_kind is provided, check all regions (CPUs are generally available everywhere)
    candidateRegions = Object.values(REGION_MAP).flat();
  } else if (opts.region && !opts.gpu_kind) {
    // If region is provided (with or without cpu_kind), use all locations in that region
    candidateRegions = REGION_MAP[opts.region] || [];
  } else if (opts.region && opts.gpu_kind) {
    // If both region and gpu_kind are provided, find the intersection
    const regionLocations = REGION_MAP[opts.region] || [];
    const gpuLocations = GPU_REGION_MAP[opts.gpu_kind] || [];
    candidateRegions = regionLocations.filter((loc) => gpuLocations.includes(loc));
  }

  // If no candidate regions found, throw an error
  if (candidateRegions.length === 0) {
    throw new Error('No candidate regions found');
  }

  // Build filters for capacity check
  const filters: { gpu_kind?: string; cpu_kind?: string } = {};
  if (opts.gpu_kind) {
    filters.gpu_kind = opts.gpu_kind;
  }
  if (opts.cpu_kind) {
    filters.cpu_kind = opts.cpu_kind;
  }

  // Check capacity for all candidate regions
  const capacityResults = await checkCapacity(candidateRegions, Object.keys(filters).length > 0 ? filters : undefined);

  // If no regions have capacity, throw an error
  if (capacityResults.length === 0 || capacityResults.some((r) => r.capacity === 0)) {
    throw HttpError.serviceUnavailable(`No compute capacity available`);
  }

  const bestFlyRegion = capacityResults.sort((a, b) => b.capacity - a.capacity)[0]?.region;
  if (!bestFlyRegion) {
    throw new Error('Failed to return the best fly region');
  }

  const bestMetallicRegion = Object.entries(REGION_MAP).find(([_, flyRegions]) => {
    return flyRegions.includes(bestFlyRegion);
  })?.[0];
  if (!bestMetallicRegion) {
    throw new Error('Failed to return the best metallic region');
  }

  return { flyRegion: bestFlyRegion, metallicRegion: bestMetallicRegion };
};

// Metallic region -> Fly region
const REGION_MAP: Record<string, string[]> = {
  'us-east-1': ['iad', 'ord'],
  'us-west-2': ['sjc', 'sea'],
  'eu-central-1': ['ams', 'fra'],
  'ap-southeast-1': ['sin']
};

const GPU_REGION_MAP: Record<string, string[]> = {
  a10: ['ord'],
  l40s: ['ord'],
  'a100-pcie-40gb': ['ord'],
  'a100-sxm4-80gb': ['iad', 'sjc', 'ams']
};

export const checkCapacity = async (
  regions: string[],
  filters?: {
    gpu_kind?: string;
    cpu_kind?: string;
  }
): Promise<{ region: string; capacity: number }[]> => {
  const params = new URLSearchParams();
  if (filters?.gpu_kind) {
    params.set('gpu_kind', filters.gpu_kind);
  }
  if (filters?.cpu_kind) {
    params.set('cpu_kind', filters.cpu_kind);
  }

  const response = await api.get<{
    Regions: { code: string; capacity: number }[];
  }>(`/v1/platform/regions${params.toString() ? '?' + params.toString() : ''}`);

  return response.data.Regions.filter((region) => regions.includes(region.code)).map((region) => ({
    region: region.code,
    capacity: region.capacity
  }));
};

export const projectIdToAppName = (projectId: string): string => {
  return projectId.replace(/_/g, '-');
};

export const generateVolumeName = (minLength: number = 12, maxLength: number = 28): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
  const safeMaxLength = Math.min(maxLength, 30);
  const length = Math.floor(Math.random() * (safeMaxLength - minLength + 1)) + minLength;

  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
};

export function fullImageRef(imageRef: MachineImageRef): string {
  const imgStr = `${imageRef.registry}/${imageRef.repository}`;
  const tag = imageRef.tag;
  const digest = imageRef.digest;

  if (tag !== '' && digest !== '') {
    return `${imgStr}:${tag}@${digest}`;
  } else if (digest !== '') {
    return `${imgStr}@${digest}`;
  } else if (tag !== '') {
    return `${imgStr}:${tag}`;
  }

  return imgStr;
}

export const stateToFlyState = (state: string): string => {
  if (state === 'stopped') {
    return 'suspended';
  }

  return state;
};

export const flyStateToState = (state: string): string => {
  if (state === 'suspended') {
    return 'stopped';
  }

  return state;
};
