import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface CachedUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  cachedAt: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private userCache = new Map<string, CachedUser>();
  private readonly CACHE_TTL_MS = 60_000; // 1 minuto

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const now = Date.now();
    const cached = this.userCache.get(payload.sub);

    if (cached && (now - cached.cachedAt) < this.CACHE_TTL_MS) {
      if (!cached.is_active) {
        throw new UnauthorizedException();
      }
      return { id: cached.id, email: cached.email, role: cached.role };
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.is_active) {
      this.userCache.delete(payload.sub);
      throw new UnauthorizedException();
    }

    this.userCache.set(payload.sub, {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      cachedAt: now,
    });

    return { id: user.id, email: user.email, role: user.role };
  }
}