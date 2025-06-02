import { api } from './api.js';
import { ORG_SLUG } from './constants.js';
import { Machine } from './types.js';

interface CreateMachineRequest {
  app_name: string;
}

export const createApp = async (req: CreateMachineRequest): Promise<Machine> => {
  const res = await api.post<Machine>(`/v1/apps`, {
    app_name: req.app_name,
    org_slug: ORG_SLUG
  });
  return res.data;
};

interface DestroyAppRequest {
  app_name: string;
}

export const destroyApp = async (req: DestroyAppRequest): Promise<void> => {
  await api.delete(`/v1/apps/${req.app_name}`);
};
