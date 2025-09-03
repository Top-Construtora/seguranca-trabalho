import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
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
import { Plus, X } from 'lucide-react';

const baseFormSchema = z.object({
  type: z.nativeEnum(QuestionType),
  date: z.string().min(1, 'Data é obrigatória'),
  employees_count: z.coerce.number().min(1, 'Número de funcionários deve ser maior que 0'),
  notes: z.string().optional(),
});

const obraFormSchema = baseFormSchema.extend({
  work_id: z.string().uuid('Selecione uma obra'),
});

const alojamentoFormSchema = baseFormSchema.extend({
  accommodation_name: z.string().min(1, 'Nome do alojamento é obrigatório'),
  work_ids: z.array(z.object({
    work_id: z.string().uuid('Selecione uma obra')
  })).min(1, 'Selecione pelo menos uma obra').max(3, 'Máximo 3 obras permitidas'),
});

interface EvaluationFormProps {
  onSubmit: (data: CreateEvaluationDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  evaluationType?: 'obra' | 'alojamento';
}

export function EvaluationForm({ onSubmit, onCancel, isLoading, evaluationType = 'obra' }: EvaluationFormProps) {
  const { data: works = [] } = useWorks();
  const activeWorks = works.filter(work => work.is_active);

  const formSchema = evaluationType === 'obra' ? obraFormSchema : alojamentoFormSchema;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: evaluationType === 'obra' ? {
      work_id: '',
      type: QuestionType.OBRA,
      date: format(new Date(), 'yyyy-MM-dd'),
      employees_count: 1,
      notes: '',
    } : {
      accommodation_name: '',
      work_ids: [{ work_id: '' }],
      type: QuestionType.ALOJAMENTO,
      date: format(new Date(), 'yyyy-MM-dd'),
      employees_count: 1,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "work_ids" as never,
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    if (evaluationType === 'alojamento') {
      // Para alojamentos, transformar os dados antes de enviar
      const alojamentoValues = values as z.infer<typeof alojamentoFormSchema>;
      const transformedData = {
        work_id: alojamentoValues.work_ids[0].work_id, // Primeira obra como principal
        accommodation_name: alojamentoValues.accommodation_name,
        work_ids: alojamentoValues.work_ids.map(w => w.work_id),
        type: alojamentoValues.type,
        date: alojamentoValues.date,
        employees_count: alojamentoValues.employees_count,
        notes: alojamentoValues.notes,
      };
      onSubmit(transformedData as CreateEvaluationDto);
    } else {
      onSubmit(values as CreateEvaluationDto);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {evaluationType === 'obra' ? (
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
        ) : (
          <>
            <FormField
              control={form.control}
              name="accommodation_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Alojamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do alojamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Obras Vinculadas</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ work_id: '' })}
                  disabled={fields.length >= 3}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Obra
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`work_ids.${index}.work_id` as never}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={index > 0 ? "sr-only" : ""}>
                          Obra {index + 1}
                        </FormLabel>
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
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      className="mb-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <FormField
          control={form.control}
          name="type"
          render={() => (
            <FormItem>
              <FormLabel>Tipo de Avaliação</FormLabel>
              <FormControl>
                <Input 
                  value={evaluationType === 'obra' ? 'Obra' : 'Alojamento'} 
                  disabled 
                  className="bg-muted"
                />
              </FormControl>
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