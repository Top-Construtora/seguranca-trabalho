import { useQuery } from '@tanstack/react-query';
import { questionsService, QuestionType } from '@/services/questions.service';

export function useQuestions(type?: QuestionType, activeOnly: boolean = true) {
  return useQuery({
    queryKey: ['questions', type, activeOnly],
    queryFn: () => questionsService.getAll(type, activeOnly),
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: ['questions', id],
    queryFn: () => questionsService.getById(id),
    enabled: !!id,
  });
}