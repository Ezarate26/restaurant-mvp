import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '../config/app-config.service';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

@Injectable()
export class SupabaseService {
  private serviceClient: SupabaseClient | null = null;

  constructor(private readonly config: AppConfigService) {}

  /** Cliente con service role — operaciones privilegiadas (solo backend). */
  serviceRole(): SupabaseClient {
    if (this.serviceClient) return this.serviceClient;
    this.serviceClient = createClient(
      this.config.supabaseUrl,
      this.config.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    return this.serviceClient;
  }

  /** Verifica un JWT de Supabase (Bearer del cliente) y devuelve el usuario. */
  async getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
    if (!token) return null;

    const client = createClient(
      this.config.supabaseUrl,
      this.config.supabaseAnonKey,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  }

  /** Email del usuario vía admin API (service role). */
  async getUserEmail(userId: string): Promise<string | null> {
    const { data } = await this.serviceRole().auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  }
}
