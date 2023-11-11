import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MapsService } from './maps.service';
import { SendSimilarityJob } from '../types/job.dto';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Post('similarity')
  async similarity(
    @Body() job: SendSimilarityJob,
  ): Promise<{ similarity_score: number }> {
    const result = await this.mapsService.similarity(job);
    if (!result) {
      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result;
  }
}
