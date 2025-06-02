import { ApiKeyObject } from '@metallichq/types';
import { useEffect, useState } from 'react';
import { listApiKeys } from '../lib/list-api-keys';
import { captureException } from '../utils/error';
import { useProjects } from './use-projects';

export const useApiKeys = () => {
  const { selectedProject } = useProjects();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyObject[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!selectedProject) {
      return;
    }

    setLoading(true);
    listApiKeys(selectedProject.id)
      .then((data) => {
        if (mounted) {
          setApiKeys(data.data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(true);
          captureException(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedProject]);

  return {
    loading,
    apiKeys,
    setApiKeys,
    defaultApiKey: apiKeys.length > 0 ? apiKeys[0] : null,
    error
  };
};
