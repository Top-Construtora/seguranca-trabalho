import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AccidentSeverity,
  AccidentType,
  BodyPart,
  SEVERITY_LABELS,
  TYPE_LABELS,
  BODY_PART_LABELS,
  Accident,
} from '@/types/accident.types';
import { useWorks } from '@/hooks/useWorks';
import { Loader2 } from 'lucide-react';

const bodyPartSchema = z.object({
  body_part: z.nativeEnum(BodyPart),
  injury_description: z.string().optional(),
});

const accidentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255),
  description: z.string().min(1, 'Descrição é obrigatória'),
  accident_date: z.string().min(1, 'Data do acidente é obrigatória'),
  work_id: z.string().uuid('Selecione uma obra'),
  severity: z.nativeEnum(AccidentSeverity, {
    errorMap: () => ({ message: 'Selecione a severidade' }),
  }),
  accident_type: z.nativeEnum(AccidentType, {
    errorMap: () => ({ message: 'Selecione o tipo de acidente' }),
  }),
  days_away: z.coerce.number().min(0).default(0),
  victim_name: z.string().optional(),
  victim_role: z.string().optional(),
  victim_company: z.string().optional(),
  location_details: z.string().optional(),
  immediate_actions: z.string().optional(),
  body_parts: z.array(bodyPartSchema).optional(),
});

type AccidentFormData = z.infer<typeof accidentSchema>;

interface AccidentFormProps {
  accident?: Accident;
  onSubmit: (data: AccidentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AccidentForm({
  accident,
  onSubmit,
  onCancel,
  isLoading = false,
}: AccidentFormProps) {
  const { data: works = [], isLoading: worksLoading } = useWorks();

  const form = useForm<AccidentFormData>({
    resolver: zodResolver(accidentSchema),
    defaultValues: {
      title: accident?.title || '',
      description: accident?.description || '',
      accident_date: accident?.accident_date
        ? new Date(accident.accident_date).toISOString().slice(0, 16)
        : '',
      work_id: accident?.work_id || '',
      severity: accident?.severity || undefined,
      accident_type: accident?.accident_type || undefined,
      days_away: accident?.days_away || 0,
      victim_name: accident?.victim_name || '',
      victim_role: accident?.victim_role || '',
      victim_company: accident?.victim_company || '',
      location_details: accident?.location_details || '',
      immediate_actions: accident?.immediate_actions || '',
      body_parts: accident?.body_parts?.map((bp) => ({
        body_part: bp.body_part,
        injury_description: bp.injury_description || '',
      })) || [],
    },
  });

  const selectedBodyParts = form.watch('body_parts') || [];

  const toggleBodyPart = (part: BodyPart) => {
    const current = selectedBodyParts;
    const exists = current.find((p) => p.body_part === part);

    if (exists) {
      form.setValue(
        'body_parts',
        current.filter((p) => p.body_part !== part)
      );
    } else {
      form.setValue('body_parts', [...current, { body_part: part }]);
    }
  };

  const handleSubmit = (data: AccidentFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Dados Básicos */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dados do Acidente</h3>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Queda de andaime no bloco A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição detalhada *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o acidente com o máximo de detalhes possível..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accident_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e hora do acidente *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="work_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Obra *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a obra" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {works
                        .filter((w) => w.is_active)
                        .map((work) => (
                          <SelectItem key={work.id} value={work.id}>
                            {work.name}
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
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severidade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a severidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="accident_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de acidente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="days_away"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias de afastamento</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Dados da Vítima */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dados da Vítima</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="victim_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da vítima</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="victim_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função/Cargo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pedreiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="victim_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa (terceirizado)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Partes do Corpo Afetadas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Partes do Corpo Afetadas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {Object.entries(BODY_PART_LABELS).map(([value, label]) => {
              const isSelected = selectedBodyParts.some(
                (p) => p.body_part === value
              );
              return (
                <label
                  key={value}
                  className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleBodyPart(value as BodyPart)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações Adicionais</h3>

          <FormField
            control={form.control}
            name="location_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detalhes do local</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o local específico onde ocorreu o acidente..."
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="immediate_actions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ações imediatas tomadas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva as ações tomadas imediatamente após o acidente..."
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {accident ? 'Salvar Alterações' : 'Registrar Acidente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
