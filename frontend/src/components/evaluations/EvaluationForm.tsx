import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateEvaluationDto } from '@/services/evaluations.service';
import { QuestionType } from '@/services/questions.service';
import { useWorks } from '@/hooks/useWorks';
import { format } from 'date-fns';

const formSchema = z.object({
  work_id: z.string().uuid('Selecione uma obra'),
  type: z.nativeEnum(QuestionType),
  date: z.string().min(1, 'Data é obrigatória'),
  employees_count: z.coerce.number().min(1, 'Número de funcionários deve ser maior que 0'),
  notes: z.string().optional(),
});

interface EvaluationFormProps {
  onSubmit: (data: CreateEvaluationDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EvaluationForm({ onSubmit, onCancel, isLoading }: EvaluationFormProps) {
  const { data: works = [] } = useWorks();
  const activeWorks = works.filter(work => work.is_active);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      work_id: '',
      type: QuestionType.OBRA,
      date: format(new Date(), 'yyyy-MM-dd'),
      employees_count: 1,
      notes: '',
    },
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="work_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Obra</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma obra" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeWorks.map((work) => (
                    <SelectItem key={work.id} value={work.id}>
                      {work.number} - {work.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Avaliação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={QuestionType.OBRA}>Obra</SelectItem>
                  <SelectItem value={QuestionType.ALOJAMENTO}>Alojamento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Avaliação</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employees_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Funcionários</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações Gerais</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações sobre a avaliação..." 
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Criando...' : 'Criar Avaliação'}
          </Button>
        </div>
      </form>
    </Form>
  );
}