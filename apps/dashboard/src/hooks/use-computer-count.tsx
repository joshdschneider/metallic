import { useEffect, useState } from 'react';
import { countComputers } from '../lib/count-computers';
import { captureException } from '../utils/error';
import { useProjects } from './use-projects';

export const useComputerCount = () => {
  const { selectedProject } = useProjects();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!selectedProject) {
      return;
    }

    setLoading(true);
    countComputers(selectedProject.id)
      .then((count) => {
        if (mounted) {
          setCount(count);
        }
      })
      .catch((error) => {
        if (mounted) {
          captureException(error);
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

  return { count, loading };
};
