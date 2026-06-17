import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../../supabase/supabase.service';
import type { RequestWithUser } from '../guards/supabase-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    return req.user as AuthenticatedUser;
  }
);
