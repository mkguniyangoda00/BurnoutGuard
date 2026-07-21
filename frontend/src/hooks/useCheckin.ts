import { useQuery } from '@tanstack/react-query';
import { checkinService } from '../services/checkin.service';
import { useAuth } from '../context/AuthContext';

export const checkinStreakQueryKey = ['checkin', 'streak'] as const;
export const checkinHistoryQueryKey = ['checkin', 'history'] as const;

export const useCheckin = () => {
	const { user } = useAuth();

	const streakQuery = useQuery({
		queryKey: [...checkinStreakQueryKey, user?.userId],
		queryFn: checkinService.getStreak,
		enabled: !!user?.userId,
		staleTime: 30_000,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
	});

	const historyQuery = useQuery({
		queryKey: [...checkinHistoryQueryKey, user?.userId],
		queryFn: checkinService.getHistory,
		enabled: !!user?.userId,
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