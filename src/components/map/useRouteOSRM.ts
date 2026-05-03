import { useState, useEffect } from 'react';
import { fetchRoadRoute, type Waypoint, type OSRMRoute } from '@/lib/osrm';

interface UseRouteResult {
  route: OSRMRoute | null;
  loading: boolean;
  error: string | null;
}

export function useRouteOSRM(waypoints: Waypoint[]): UseRouteResult {
  const [route,   setRoute]   = useState<OSRMRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (waypoints.length < 2) return;
    setLoading(true);
    setError(null);

    fetchRoadRoute(waypoints)
      .then((r) => setRoute(r))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(waypoints)]); // stringify for deep comparison

  return { route, loading, error };
}
