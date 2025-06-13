import { SubscriptionObject } from '@metallichq/types';
import { useEffect, useState } from 'react';
import { listSubscriptions } from '../lib/list-subscriptions';
import { captureException } from '../utils/error';
import { useOrganizations } from './use-organizations';

export const useSubscriptions = () => {
  const { selectedOrganizationId } = useOrganizations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionObject[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!selectedOrganizationId) {
      return;
    }

    setLoading(true);
    listSubscriptions(selectedOrganizationId)
      .then((data) => {
        if (mounted) {
          setSubscriptions(data.data);
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
  }, [selectedOrganizationId]);

  function getPlan() {
    if (subscriptions.length === 0) {
      return 'free';
    }

    const activeSubscription = subscriptions.find((s) => s.status === 'active');
    if (activeSubscription) {
      return activeSubscription.plan;
    }

    const pastDueOrTrialingSubscription = subscriptions.find((s) => ['past_due', 'trialing'].includes(s.status));
    if (pastDueOrTrialingSubscription) {
      return pastDueOrTrialingSubscription.plan;
    }

    return 'free';
  }

  return {
    loading,
    subscriptions,
    plan: getPlan(),
    error
  };
};
