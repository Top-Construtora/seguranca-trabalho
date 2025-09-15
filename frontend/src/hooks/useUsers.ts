import { useQuery } from '@tanstack/react-query';
import { usersService } from '../services/users.service';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersService.getById(id),
    enabled: !!id,
  });
}