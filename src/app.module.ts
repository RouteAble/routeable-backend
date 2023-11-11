import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BlockchainController } from './blockchain/blockchain.controller';
import { BlockchainModule } from './blockchain/blockchain.module';
import { MapsController } from './maps/maps.controller';
import { MapsModule } from './maps/maps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BlockchainModule,
    MapsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
