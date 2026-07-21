import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import { useAuth } from '../context/AuthContext';

export const chatHistoryQueryKey = ['chat', 'history'] as const;

export const useChat = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const scopedKey = [...chatHistoryQueryKey, user?.userId];

  const historyQuery = useQuery({
    queryKey: scopedKey,
    queryFn: chatService.getHistory,
    enabled: !!user?.userId,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const sendMutation = useMutation({
    mutationFn: chatService.sendMessage,
    onSuccess: (data) => {
      queryClient.setQueryData(scopedKey, data.messages);
    },
  });

  return {
    messages: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    isError: historyQuery.isError,
    error: historyQuery.error ?? sendMutation.error,
    isSending: sendMutation.isPending,
    sendMessage: sendMutation.mutateAsync,
    refetchHistory: historyQuery.refetch,
  };
};