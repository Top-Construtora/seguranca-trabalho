import { DataSource } from 'typeorm';
import { PenaltyTable } from '../../modules/evaluations/entities/penalty-table.entity';

export const seedPenaltyTable = async (dataSource: DataSource) => {
  const penaltyRepository = dataSource.getRepository(PenaltyTable);

  const penalties = [
    // Peso 1
    { employees_min: 1, employees_max: 10, weight: 1, min_value: 1513.04, max_value: 1891.30 },
    { employees_min: 11, employees_max: 25, weight: 1, min_value: 1891.31, max_value: 3782.61 },
    { employees_min: 26, employees_max: 50, weight: 1, min_value: 3782.62, max_value: 5673.91 },
    { employees_min: 51, employees_max: 100, weight: 1, min_value: 5673.92, max_value: 7565.22 },
    { employees_min: 101, employees_max: 250, weight: 1, min_value: 7565.23, max_value: 11347.83 },
    { employees_min: 251, employees_max: 500, weight: 1, min_value: 11347.84, max_value: 15130.43 },
    { employees_min: 501, employees_max: 1000, weight: 1, min_value: 15130.44, max_value: 30260.87 },
    { employees_min: 1001, employees_max: 999999, weight: 1, min_value: 30260.88, max_value: 37826.09 },
    // Peso 2
    { employees_min: 1, employees_max: 10, weight: 2, min_value: 1891.30, max_value: 2269.57 },
    { employees_min: 11, employees_max: 25, weight: 2, min_value: 2269.58, max_value: 4539.13 },
    { employees_min: 26, employees_max: 50, weight: 2, min_value: 4539.14, max_value: 6808.70 },
    { employees_min: 51, employees_max: 100, weight: 2, min_value: 6808.71, max_value: 9078.26 },
    { employees_min: 101, employees_max: 250, weight: 2, min_value: 9078.27, max_value: 13617.39 },
    { employees_min: 251, employees_max: 500, weight: 2, min_value: 13617.40, max_value: 18156.52 },
    { employees_min: 501, employees_max: 1000, weight: 2, min_value: 18156.53, max_value: 36313.04 },
    { employees_min: 1001, employees_max: 999999, weight: 2, min_value: 36313.05, max_value: 45391.30 },
    // Peso 3
    { employees_min: 1, employees_max: 10, weight: 3, min_value: 2269.57, max_value: 3026.09 },
    { employees_min: 11, employees_max: 25, weight: 3, min_value: 3026.10, max_value: 5673.91 },
    { employees_min: 26, employees_max: 50, weight: 3, min_value: 5673.92, max_value: 8321.74 },
    { employees_min: 51, employees_max: 100, weight: 3, min_value: 8321.75, max_value: 10969.57 },
    { employees_min: 101, employees_max: 250, weight: 3, min_value: 10969.58, max_value: 18156.52 },
    { employees_min: 251, employees_max: 500, weight: 3, min_value: 18156.53, max_value: 25343.48 },
    { employees_min: 501, employees_max: 1000, weight: 3, min_value: 25343.49, max_value: 45391.30 },
    { employees_min: 1001, employees_max: 999999, weight: 3, min_value: 45391.31, max_value: 75652.17 },
    // Peso 4
    { employees_min: 1, employees_max: 10, weight: 4, min_value: 3026.09, max_value: 3782.61 },
    { employees_min: 11, employees_max: 25, weight: 4, min_value: 3782.62, max_value: 7565.22 },
    { employees_min: 26, employees_max: 50, weight: 4, min_value: 7565.23, max_value: 11347.83 },
    { employees_min: 51, employees_max: 100, weight: 4, min_value: 11347.84, max_value: 15130.43 },
    { employees_min: 101, employees_max: 250, weight: 4, min_value: 15130.44, max_value: 22695.65 },
    { employees_min: 251, employees_max: 500, weight: 4, min_value: 22695.66, max_value: 30260.87 },
    { employees_min: 501, employees_max: 1000, weight: 4, min_value: 30260.88, max_value: 60521.74 },
    { employees_min: 1001, employees_max: 999999, weight: 4, min_value: 60521.75, max_value: 151304.35 },
  ];

  for (const penalty of penalties) {
    const exists = await penaltyRepository.findOne({
      where: {
        employees_min: penalty.employees_min,
        employees_max: penalty.employees_max,
        weight: penalty.weight,
      },
    });

    if (!exists) {
      await penaltyRepository.save(penalty);
    }
  }

  console.log('Penalty table seeded successfully');
};