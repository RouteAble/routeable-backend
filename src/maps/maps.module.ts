import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { SupabaseService } from '../supabase/supabase.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [MapsController],
  providers: [MapsService, SupabaseService],
})
export class MapsModule {}