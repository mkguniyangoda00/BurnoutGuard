import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';

export const chatHistoryQueryKey = ['chat', 'history'] as const;

export const useChat = () => {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: chatHistoryQueryKey,
    queryFn: chatService.getHistory,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const sendMutation = useMutation({
    mutationFn: chatService.sendMessage,
    onSuccess: (data) => {
      queryClient.setQueryData(chatHistoryQueryKey, data.messages);
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
