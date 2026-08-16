import { useQuery } from '@tanstack/react-query';
import { predictionService } from '../services/prediction.service';
import { useAuth } from '../context/AuthContext';

export const predictionQueryKey = ['prediction', 'latest'] as const;

export const usePrediction = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [...predictionQueryKey, user?.userId],
    queryFn: predictionService.getLatest,
    enabled: !!user?.userId,
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const prediction = query.data?.prediction ?? null;
  const dimensionBreakdown = query.data?.dimensionBreakdown ?? [];
  const calibrationConfidence = query.data?.calibrationConfidence ?? null;

  return {
    ...query,
    prediction,
    dimensionBreakdown,
    calibrationConfidence,
    isEmpty: !query.isLoading && !query.isError && !prediction,
  };
};