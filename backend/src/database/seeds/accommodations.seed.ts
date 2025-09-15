import { DataSource } from 'typeorm';
import { Accommodation } from '../../modules/works/entities/accommodation.entity';

export async function seedAccommodations(dataSource: DataSource) {
  const accommodationRepository = dataSource.getRepository(Accommodation);
  
  const existingCount = await accommodationRepository.count();
  if (existingCount > 0) {
    console.log('Accommodations already exist, skipping seed');
    return;
  }

  const accommodations = [
    { name: 'Alojamento A - Bloco 1' },
    { name: 'Alojamento B - Bloco 2' },
    { name: 'Alojamento Central' },
    { name: 'Alojamento Temporário' },
    { name: 'Casa de Hóspedes' },
  ];

  for (const accommodationData of accommodations) {
    const accommodation = accommodationRepository.create(accommodationData);
    await accommodationRepository.save(accommodation);
    console.log(`Accommodation created: ${accommodation.name}`);
  }

  console.log('Accommodations seeded successfully');
}