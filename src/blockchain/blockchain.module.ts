import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BullModule } from '@nestjs/bull';
import { BlockchainConsumerService } from './blockchain.consumer.service';
import { BlockchainController } from './blockchain.controller';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'redis',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'tx-queue',
      limiter: {
        max: 1,
        duration: 2000,
      },
    }),
  ],
  controllers: [BlockchainController],
  providers: [BlockchainService, BlockchainConsumerService],
  exports: [BlockchainService],
})
export class BlockchainModule {}