import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthenticatedUser } from '../../supabase/supabase.service';

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/** Valida el Bearer token de Supabase y adjunta req.user. */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const header = req.headers['authorization'];

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('No autenticado');
    }

    const token = header.slice(7).trim();
    const user = await this.supabase.getUserFromToken(token);
    if (!user) {
      throw new UnauthorizedException('No autenticado');
    }

    req.user = user;
    return true;
  }
}
