import { api } from './api.js';
import { MachineGuest, Volume } from './types.js';

interface CreateVolumeRequest {
  app_name: string;
  region: string;
  name?: string;
  source_volume_id?: string;
  size_gb?: number;
  compute_image?: string;
  compute?: MachineGuest;
}

export const createVolume = async (req: CreateVolumeRequest): Promise<Volume> => {
  const res = await api.post<Volume>(`/v1/apps/${req.app_name}/volumes`, {
    region: req.region,
    name: req.name,
    source_volume_id: req.source_volume_id,
    size_gb: req.size_gb,
    compute_image: req.compute_image,
    compute: req.compute
  });
  return res.data;
};

interface GetVolumeRequest {
  app_name: string;
  volume_id: string;
}

export const getVolume = async (req: GetVolumeRequest): Promise<Volume> => {
  const res = await api.get<Volume>(`/v1/apps/${req.app_name}/volumes/${req.volume_id}`);
  return res.data;
};

interface DestroyVolumeRequest {
  app_name: string;
  volume_id: string;
}

export const destroyVolume = async (req: DestroyVolumeRequest): Promise<void> => {
  await api.delete(`/v1/apps/${req.app_name}/volumes/${req.volume_id}`);
};
