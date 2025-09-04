import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database.config';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

export class UsersService {
  private userRepository = AppDataSource.getRepository(User);

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password_hash: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'is_active', 'created_at'],
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'is_active', 'created_at'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password_hash', 'role', 'is_active'],
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) return null;
    
    if (updateData.password_hash) {
      updateData.password_hash = await bcrypt.hash(updateData.password_hash, 10);
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async toggleActive(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    user.is_active = !user.is_active;
    return this.userRepository.save(user);
  }
}