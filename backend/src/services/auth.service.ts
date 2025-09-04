import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database.config';
import { User } from '../entities/user.entity';
import { LoginDto } from '../dto/login.dto';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    } as any);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      
      if (!user || !user.is_active) {
        throw new Error('Invalid token');
      }
      
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}