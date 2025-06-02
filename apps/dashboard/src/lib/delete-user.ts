import { api } from './api';

export const deleteUser = async (userId: string) => {
  await api.delete(`/web/users/${userId}`);
};
