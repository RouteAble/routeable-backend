import {
  Controller,
  Post,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { ErgoAddress } from '@fleet-sdk/core';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('send/:address/:amount')
  async send(
    @Param('address') address: string,
    @Param('amount') amount: bigint,
  ) {
    try {
      if (!ErgoAddress.validate(address)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }
      const result = await this.blockchainService.dispatchSend({
        amount,
        recipient: address,
      });
      return { success: true, result: result };
    } catch (error) {
      if (error.status === HttpStatus.BAD_REQUEST) {
        throw error;
      } else {
        throw new HttpException(
          'Server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
