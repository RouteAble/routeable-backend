import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SendTxJob } from '../types/job.dto';

@Injectable()
export class BlockchainService {
  constructor(@InjectQueue('tx-queue') private queue: Queue) {}

  async dispatchSend(jobArguments: SendTxJob) {
    await this.queue.add('send-tx', jobArguments);
  }
}
