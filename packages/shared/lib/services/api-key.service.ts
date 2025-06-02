import { database, Prisma } from '@metallichq/database';
import { ApiKey, ApiKeySchema } from '@metallichq/types';
import { generateApiKey, generateId, now } from '../utils/index.js';
import { decryptApiKey, encryptApiKey, hashApiKey } from './encryption.service.js';

export const getApiKeysByProjectId = async (projectId: string): Promise<ApiKey[]> => {
  const apiKeys = await database.apiKey.findMany({
    where: { project_id: projectId, deleted_at: null }
  });

  return apiKeys.map((apiKey) => decryptApiKey(ApiKeySchema.parse(apiKey)));
};

export const getApiKeyById = async (apiKeyId: string): Promise<ApiKey | null> => {
  const apiKey = await database.apiKey.findUnique({
    where: { id: apiKeyId, deleted_at: null }
  });

  if (!apiKey) {
    return null;
  }

  return decryptApiKey(ApiKeySchema.parse(apiKey));
};

export const createApiKey = async (apiKey: { projectId: string; name?: string | null }): Promise<ApiKey> => {
  const key = generateApiKey();
  const keyHash = await hashApiKey(key);

  const apiKeyData: Prisma.ApiKeyUncheckedCreateInput = {
    id: generateId(),
    key: key,
    key_hash: keyHash,
    key_iv: null,
    key_tag: null,
    project_id: apiKey.projectId,
    name: apiKey.name,
    created_at: now(),
    updated_at: now(),
    deleted_at: null
  };

  const encryptedApiKey = encryptApiKey(ApiKeySchema.parse(apiKeyData));
  const newApiKey = await database.apiKey.create({
    data: encryptedApiKey
  });

  return decryptApiKey(ApiKeySchema.parse(newApiKey));
};

export const updateApiKey = async (apiKeyId: string, data: { name?: string | null }): Promise<ApiKey> => {
  const updatedApiKey = await database.apiKey.update({
    where: { id: apiKeyId },
    data: { name: data.name, updated_at: now() }
  });

  return decryptApiKey(ApiKeySchema.parse(updatedApiKey));
};

export const deleteApiKey = async (apiKeyId: string): Promise<ApiKey> => {
  const deletedApiKey = await database.apiKey.update({
    where: { id: apiKeyId },
    data: { deleted_at: now() }
  });

  return decryptApiKey(ApiKeySchema.parse(deletedApiKey));
};
