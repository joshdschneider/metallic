import { UserObject } from '@metallichq/types';

export const getServerUrl = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  if (!serverUrl) {
    throw new Error('Failed to load server URL from environment');
  }

  return serverUrl;
};

export const getUserAvatarFallback = (user: UserObject): string => {
  if (user.first_name) {
    return user.first_name[0].toUpperCase();
  }

  return user.email[0].toUpperCase();
};

export const getUserName = (userLike: {
  first_name: string | null;
  last_name: string | null;
  email: string;
  [key: string]: any;
}): string => {
  if (userLike.first_name && userLike.last_name) {
    return `${userLike.first_name} ${userLike.last_name}`;
  }

  return userLike.first_name || userLike.last_name || '';
};

export const shortenKey = (key: string) => {
  return key.slice(0, 7) + '...' + key.slice(-4);
};

export const toTitleCase = (str: string) => {
  const words = str.split('-');
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const getRoleDescription = (role: string) => {
  switch (role) {
    case 'owner':
      return `Owners can manage all resources, including teams and projects.`;
    case 'admin':
      return `Admins can invite, configure projects, and manage resources.`;
    case 'member':
      return `Members can only manage resources within a project.`;
    default:
      return '';
  }
};
