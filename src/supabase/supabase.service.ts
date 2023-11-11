import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADDRESS, SUPABASE_API_KEY } from '../api/env';

@Injectable()
export class SupabaseService {
  private readonly supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = createClient(SUPABASE_ADDRESS(), SUPABASE_API_KEY());
  }

  public getClient(): SupabaseClient {
    return this.supabaseClient;
  }
}
