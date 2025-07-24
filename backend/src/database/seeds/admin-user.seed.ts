import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export const seedAdminUser = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);

  const adminEmail = 'admin@sst.com';
  
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = userRepository.create({
      name: 'Administrador',
      email: adminEmail,
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
      is_active: true,
    });

    await userRepository.save(adminUser);
    console.log('Admin user created successfully');
    console.log('Email: admin@sst.com');
    console.log('Password: admin123');
    console.log('IMPORTANT: Change this password after first login!');
  } else {
    console.log('Admin user already exists');
  }
};