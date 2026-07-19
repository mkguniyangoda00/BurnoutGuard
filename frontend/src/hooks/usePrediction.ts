import { useQuery } from '@tanstack/react-query';
import { predictionService } from '../services/prediction.service';

export const predictionQueryKey = ['prediction', 'latest'] as const;

export const usePrediction = () => {
	const query = useQuery({
		queryKey: predictionQueryKey,
		queryFn: predictionService.getLatest,
		staleTime: 60_000,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
	});

	const prediction = query.data ?? null;

	return {
		...query,
		prediction,
		isEmpty: !query.isLoading && !query.isError && !prediction,
	};
};
