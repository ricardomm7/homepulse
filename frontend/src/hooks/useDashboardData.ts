import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useDashboardData() {
  const { data: health, error: healthError } = useSWR(`${API_BASE}/health`, fetcher, { refreshInterval: 10000 });
  const { data: powerLatest, error: powerLatestError } = useSWR(`${API_BASE}/api/power/latest`, fetcher, { refreshInterval: 10000 });
  const { data: powerHistory } = useSWR(`${API_BASE}/api/power/history`, fetcher, { refreshInterval: 60000 });
  const { data: outages } = useSWR(`${API_BASE}/api/power/outages`, fetcher, { refreshInterval: 60000 });
  
  const { data: networkHistory } = useSWR(`${API_BASE}/api/network/history`, fetcher, { refreshInterval: 10000 });
  const { data: speedtestLatest } = useSWR(`${API_BASE}/api/speedtest/latest`, fetcher, { refreshInterval: 60000 });
  const { data: speedtestHistory } = useSWR(`${API_BASE}/api/speedtest/history`, fetcher, { refreshInterval: 60000 });

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
