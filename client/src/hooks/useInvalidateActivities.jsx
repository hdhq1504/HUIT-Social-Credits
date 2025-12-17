import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ACTIVITIES_QUERY_KEY, MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import { PROGRESS_QUERY_KEY } from '@api/stats.api';

const normalizeKey = (key) => {
  if (!key) return null;
  if (Array.isArray(key)) return { queryKey: key, exact: false };
  if (typeof key === 'string') return { queryKey: [key], exact: false };
  if (typeof key === 'object' && key.queryKey) return { exact: false, ...key };
  return null;
};

function useInvalidateActivities({ refetchMine = true } = {}) {
  const queryClient = useQueryClient();

  return useCallback(
    async (...additionalKeys) => {
      const keys = [ACTIVITIES_QUERY_KEY, MY_ACTIVITIES_QUERY_KEY, PROGRESS_QUERY_KEY, ...additionalKeys];
      const tasks = keys
        .map(normalizeKey)
        .filter(Boolean)
        .map((config) => queryClient.invalidateQueries(config));

      await Promise.all(tasks);

      if (refetchMine) {
        await queryClient.refetchQueries({
          queryKey: MY_ACTIVITIES_QUERY_KEY,
          exact: false,
          type: 'active',
        });
      }
    },
    [queryClient, refetchMine],
  );
}

export default useInvalidateActivities;
