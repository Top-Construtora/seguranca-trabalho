import { useQuery } from '@tanstack/react-query';
import { worksService } from '../services/works.service';

export function useAccommodations() {
  return useQuery({
    queryKey: ['accommodations'],
    queryFn: () => worksService.getAllAccommodations(),
  });
}