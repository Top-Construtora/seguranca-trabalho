import { Evaluation } from '@/services/evaluations.service';

export interface PenaltyTableEntry {
  weight: number;
  employees_min: number;
  employees_max: number;
  min_value: number;
  max_value: number;
}

export function calculatePenaltyRange(evaluation: Evaluation, penaltyTable: PenaltyTableEntry[]): { min: number; max: number } {
  if (!evaluation.answers || evaluation.answers.length === 0 || !penaltyTable || penaltyTable.length === 0) {
    return { min: 0, max: 0 };
  }

  const employeeCount = evaluation.employees_count || 100; // Padrão para 100 se não tiver

  // Contar quantas não conformidades existem por peso
  const nonConformitiesByWeight: Record<number, number> = {};

  if (evaluation.answers && Array.isArray(evaluation.answers)) {
    evaluation.answers.forEach(answer => {
      const answerValue = answer.answer;
      if (answerValue === 'nao') {
        const weight = answer.question?.weight || 1;
        nonConformitiesByWeight[weight] = (nonConformitiesByWeight[weight] || 0) + 1;
      }
    });
  }

  // Calcular valores mínimo e máximo de multa
  let minValue = 0;
  let maxValue = 0;

  Object.entries(nonConformitiesByWeight).forEach(([weightStr, count]) => {
    const weight = parseInt(weightStr);
    const penaltyRow = penaltyTable.find(
      p => p.weight === weight &&
           p.employees_min <= employeeCount &&
           p.employees_max >= employeeCount
    );

    if (penaltyRow) {
      minValue += penaltyRow.min_value * count;
      maxValue += penaltyRow.max_value * count;
    }
  });

  // Aplicar fator de correção monetária de 1,0641
  minValue = minValue * 1.0641;
  maxValue = maxValue * 1.0641;

  return {
    min: minValue,
    max: maxValue
  };
}