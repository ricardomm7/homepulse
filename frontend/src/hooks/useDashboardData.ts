import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useDashboardData() {
  const { data: health, error: healthError } = useSWR(`/health`, fetcher, { refreshInterval: 10000 });
  const { data: powerLatest, error: powerLatestError } = useSWR(`/api/power/latest`, fetcher, { refreshInterval: 10000 });
  const { data: powerHistory } = useSWR(`/api/power/history`, fetcher, { refreshInterval: 60000 });
  const { data: outages } = useSWR(`/api/power/outages`, fetcher, { refreshInterval: 60000 });
  
  const { data: networkHistory } = useSWR(`/api/network/history`, fetcher, { refreshInterval: 10000 });
  const { data: speedtestLatest } = useSWR(`/api/speedtest/latest`, fetcher, { refreshInterval: 60000 });
  const { data: speedtestHistory } = useSWR(`/api/speedtest/history`, fetcher, { refreshInterval: 60000 });

  return {
    health,
    powerLatest,
    powerHistory,
    outages,
    networkHistory,
    speedtestLatest,
    speedtestHistory,
    isLoading: !health && !healthError,
    isError: healthError || powerLatestError
  };
}
