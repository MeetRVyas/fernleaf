'use client';

import { login, logout, me } from '@fernleaf/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export const sessionKey = ['auth', 'me'] as const;

export function useSession() {
  return useQuery({ queryKey: sessionKey, queryFn: () => api.call(me), retry: false, staleTime: 60_000 });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { email: string; password: string }) => api.call(login, { body: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => api.call(logout), onSuccess: () => queryClient.clear() });
}
