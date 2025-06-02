import { UserObject } from '@metallichq/types';
import { api } from './api';

interface UpdateUserProps {
  firstName?: string;
  lastName?: string;
  emailSubscriptions?: string[];
}

export const updateUser = async (userId: string, data: UpdateUserProps) => {
  const response = await api.put<UserObject>(`/web/users/${userId}`, {
    first_name: data.firstName,
    last_name: data.lastName,
    email_subscriptions: data.emailSubscriptions
  });
  return response.data;
};
