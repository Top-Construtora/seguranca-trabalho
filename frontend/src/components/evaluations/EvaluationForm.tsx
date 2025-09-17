import { useForm, useFieldArray } from 'react-hook-form';
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
  FormDescription,
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
import { Plus, X, Home, Building2, Calendar, Users, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  accommodation_name: z.string()
    .min(1, 'Nome do alojamento é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9À-ÿ\s\-\.]+$/, 'Nome contém caracteres inválidos'),
  work_ids: z.array(z.object({
    work_id: z.string().uuid('Selecione uma obra')
  }))
    .min(1, 'Selecione pelo menos uma obra')
    .max(3, 'Máximo 3 obras permitidas')
    .refine((works) => {
      const uniqueWorks = new Set(works.map(w => w.work_id));
      return uniqueWorks.size === works.length;
    }, 'Não pode selecionar a mesma obra múltiplas vezes'),
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

  const selectedWorkIds = evaluationType === 'alojamento'
    ? form.watch('work_ids')?.map(w => w.work_id) || []
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <span>Informações do Alojamento</span>
              </div>

              <FormField
                control={form.control}
                name="accommodation_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Nome do Alojamento
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Ex: Alojamento Central - Bloco A"
                          className={cn(
                            "pr-10",
                            field.value && field.value.length > 0 && "border-green-500 focus:ring-green-500"
                          )}
                          {...field}
                        />
                        {field.value && field.value.length > 0 && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4" />
                    Obras Vinculadas
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vincule as obras que utilizam este alojamento
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="hidden sm:flex">
                    {fields.length}/3 obras
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ work_id: '' })}
                    disabled={fields.length >= 3}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Adicionar Obra</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>

              {fields.length === 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Nenhuma obra vinculada. Clique em "Adicionar Obra" para começar.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`work_ids.${index}.work_id` as never}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-normal">
                                  Obra {index + 1}
                                </Badge>
                                {index === 0 && <Badge variant="default" className="text-xs">Principal</Badge>}
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className={cn(
                                    field.value && "border-green-500 text-green-900"
                                  )}>
                                    <SelectValue placeholder="Selecione uma obra" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {activeWorks
                                    .filter(work => !selectedWorkIds.includes(work.id) || work.id === field.value)
                                    .map((work) => (
                                      <SelectItem key={work.id} value={work.id}>
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-3 w-3 text-muted-foreground" />
                                          <span className="font-medium">{work.number}</span>
                                          <span className="text-muted-foreground">-</span>
                                          <span>{work.name}</span>
                                          {work.address && (
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              {work.address}
                                            </Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  {activeWorks.filter(work => !selectedWorkIds.includes(work.id) || work.id === field.value).length === 0 && (
                                    <div className="text-sm text-muted-foreground p-2">
                                      Nenhuma obra disponível
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remover obra</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            <span>Detalhes da Avaliação</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data da Avaliação
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      className={cn(
                        field.value && "border-green-500"
                      )}
                    />
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
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Número de Funcionários
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max="9999"
                        placeholder="Ex: 25"
                        className={cn(
                          "pr-16",
                          field.value > 0 && "border-green-500"
                        )}
                        {...field}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        pessoas
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações Gerais
                <Badge variant="outline" className="text-xs font-normal">Opcional</Badge>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione observações relevantes sobre a avaliação, condições especiais ou informações importantes..."
                  className="resize-none min-h-[100px]"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/500 caracteres
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="text-red-500">*</span>
              Campos obrigatórios
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Criar Avaliação
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}