import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
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
      select: ['id', 'name', 'email', 'role', 'is_active', 'must_change_password', 'created_at'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'is_active', 'must_change_password', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password_hash', 'role', 'is_active', 'must_change_password'],
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateData.password_hash) {
      updateData.password_hash = await bcrypt.hash(updateData.password_hash, 10);
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.is_active = !user.is_active;
    return this.userRepository.save(user);
  }

  async changePassword(
    id: string,
    newPassword: string,
    currentPassword?: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password_hash', 'must_change_password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Se forneceu senha atual, validar (para troca voluntária de senha)
    if (currentPassword) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new ConflictException('Senha atual incorreta');
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, {
      password_hash: hashedPassword,
      must_change_password: false,
    });

    return this.findOne(id);
  }

  async resetPassword(id: string, newPassword: string): Promise<User> {
    const user = await this.findOne(id);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, {
      password_hash: hashedPassword,
      must_change_password: true,
    });

    return this.findOne(id);
  }

  async getProfileStats(userId: string) {
    const user = await this.findOne(userId);

    // Buscar estatísticas de avaliações
    const evaluationStats = await this.dataSource.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN type = 'obra' THEN 1 END) as obra,
        COUNT(CASE WHEN type = 'alojamento' THEN 1 END) as alojamento
      FROM evaluations
      WHERE user_id = $1
    `, [userId]);

    // Buscar últimas avaliações
    const recentEvaluations = await this.dataSource.query(`
      SELECT
        e.id,
        e.type,
        e.status,
        e.date,
        e.total_penalty,
        e.created_at,
        w.name as work_name,
        w.number as work_number,
        a.name as accommodation_name
      FROM evaluations e
      LEFT JOIN works w ON e.work_id = w.id
      LEFT JOIN accommodations a ON e.accommodation_id = a.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
      LIMIT 10
    `, [userId]);

    // Buscar estatísticas de acidentes registrados pelo usuário
    const accidentStats = await this.dataSource.query(`
      SELECT COUNT(*) as total
      FROM accidents
      WHERE reported_by_id = $1
    `, [userId]);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      evaluations: {
        total: parseInt(evaluationStats[0]?.total || '0'),
        completed: parseInt(evaluationStats[0]?.completed || '0'),
        draft: parseInt(evaluationStats[0]?.draft || '0'),
        byType: {
          obra: parseInt(evaluationStats[0]?.obra || '0'),
          alojamento: parseInt(evaluationStats[0]?.alojamento || '0'),
        },
      },
      accidents: {
        total: parseInt(accidentStats[0]?.total || '0'),
      },
      recentEvaluations,
    };
  }
}