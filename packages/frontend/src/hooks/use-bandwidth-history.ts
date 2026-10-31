import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { useServerStore } from '../stores/server.store';

export function useBandwidthHistory(range: string) {
  const { selectedConfigId, selectedSid } = useServerStore();
  return useQuery({
    queryKey: ['bandwidth-history', selectedConfigId, selectedSid, range],
    queryFn: () => dashboardApi.bandwidthHistory(selectedConfigId!, selectedSid!, range),
    enabled: !!selectedConfigId && !!selectedSid,
    // The sampler writes one bucket per minute, so a short refetch is pointless.
    refetchInterval: 30000,
  });
}
