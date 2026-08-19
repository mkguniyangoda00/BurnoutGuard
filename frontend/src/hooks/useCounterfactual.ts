import { useQuery } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

export interface CounterfactualChangedFactor {
  featureName: string;
  from: number;
  to: number;
}

export interface CounterfactualResult {
  currentRiskLevel: string;
  currentRiskScore: number;
  simulatedRiskLevel: string;
  simulatedRiskScore: number;
  changedFactors: CounterfactualChangedFactor[];
  validity: boolean;
  proximity: number | null;
  sparsity: number;
  feasibility?: string;
}

export const counterfactualQueryKey = ['prediction', 'counterfactual'] as const;

export const useCounterfactual = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [...counterfactualQueryKey, user?.userId],
    queryFn: async () => {
      const res = await client.get('/predictions/counterfactual');
      return (res.data.counterfactual ?? null) as CounterfactualResult | null;
    },
    enabled: !!user?.userId,
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    counterfactual: query.data ?? null,
  };
};
