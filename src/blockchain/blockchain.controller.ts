import {
  Controller,
  Post,
  Param,
  HttpStatus,
  HttpException,
  Body,
} from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { ErgoAddress } from '@fleet-sdk/core';

interface BlockchainTxParams {
  address: string;
  amount: number;
}

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('send/')
  async send(@Body() params: BlockchainTxParams) {
    const amount = params.amount;
    const address = params.address;
    console.log(address);
    try {
      if (!ErgoAddress.validate(address)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }
      console.log('dispatching');
      const result = await this.blockchainService.dispatchSend({
        amount,
        recipient: address,
      });
      return { success: true, result: result };
    } catch (error) {
      console.log(error);
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
