import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [MapsController],
  providers: [MapsService, SupabaseService],
})
export class MapsModule {}
