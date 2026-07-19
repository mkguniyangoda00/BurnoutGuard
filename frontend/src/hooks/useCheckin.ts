import { useQuery } from '@tanstack/react-query';
import { checkinService } from '../services/checkin.service';

export const checkinStreakQueryKey = ['checkin', 'streak'] as const;
export const checkinHistoryQueryKey = ['checkin', 'history'] as const;

export const useCheckin = () => {
	const streakQuery = useQuery({
		queryKey: checkinStreakQueryKey,
		queryFn: checkinService.getStreak,
		staleTime: 30_000,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
	});

	const historyQuery = useQuery({
		queryKey: checkinHistoryQueryKey,
		queryFn: checkinService.getHistory,
		staleTime: 30_000,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
	});

	return {
		streakQuery,
		historyQuery,
		streak: streakQuery.data ?? 0,
		checkIns: historyQuery.data ?? [],
	};
};
